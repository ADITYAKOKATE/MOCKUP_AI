const axios = require('axios');
const Question = require('../models/Question');
const Performance = require('../models/Performance');

const AI_SERVICE_URL = 'http://localhost:5001/generate-questions';

/**
 * Generate remedial questions for a user based on weak topics
 * @param {string} userId - User ID
 * @param {string} examType - Exam Name (e.g. "JEE Main")
 */
exports.generateRemedialQuestions = async (userId, examType) => {
    try {
        console.log(`[QuestionGenerator] 🤖 Checking weak areas for User ${userId}, Exam: ${examType}`);

        // 1. Get weak topics (Threshold 75% to catch decreasing trends early, Limit 2 topics)
        const weakTopics = await Performance.getWeakTopics(userId, examType, 75, 2);

        if (weakTopics.length === 0) {
            console.log('[QuestionGenerator] No active weak topics found (<50% strength). Skipping generation.');
            return;
        }

        console.log(`[QuestionGenerator] Found ${weakTopics.length} weak topics: ${weakTopics.map(t => t.topic).join(', ')}`);

        // 2. Process each weak topic
        for (const item of weakTopics) {
            const { topic, lastStrengthDrop } = item;

            // User Request: Only generate for topics where strength JUST decreased.
            // If lastStrengthDrop is missing, the strength hasn't dropped (or pre-dates this feature).
            // If it's old, it's a stable weak topic.
            // We define "recent" as within the last 1 hour (since this runs immediately after test submission).
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

            if (!lastStrengthDrop || new Date(lastStrengthDrop) < oneHourAgo) {
                console.log(`[QuestionGenerator] ⏭️ Skipping topic "${topic}" (Stable Weakness). Last drop: ${lastStrengthDrop || 'Never'}`);
                continue;
            }

            // 3. Fetch Examples (Few-Shot)
            // We need 2-3 examples to guide the model
            const examples = await Question.aggregate([
                {
                    $match: {
                        exam: examType,
                        topic: topic,
                        isAiGenerated: { $ne: true } // Don't use AI questions as examples
                    }
                },
                { $sample: { size: 2 } }
            ]);

            if (examples.length === 0) {
                console.log(`[QuestionGenerator] ⚠️ No existing examples found for topic "${topic}". Cannot generate few-shot prompt. Skipping.`);
                continue;
            }

            // 4. Call AI Service
            // Map examples to simple format
            const formattedExamples = examples.map(ex => ({
                question: ex.question,
                options: ex.options,
                correct_answer: ex.correctAnswer,
                explanation: ex.explanation || "Detailed solution not provided.",
                type: ex.type
            }));

            // Assume subject is same for the topic (take from first example)
            const subject = examples[0].subject;

            // Prepare Payload
            const payload = {
                subject: subject,
                topic: topic,
                difficulty: 'Medium', // Target remediation difficulty
                exam_type: examType,
                examples: formattedExamples,
                count: 3 // Generate 3 new questions
            };

            console.log(`[QuestionGenerator] 🚀 Requesting AI generation for "${topic}"...`);

            try {
                // Set timeout to avoid hanging forever
                const response = await axios.post(AI_SERVICE_URL, payload, { timeout: 120000 });
                const newQuestionsData = response.data.questions;

                if (newQuestionsData && newQuestionsData.length > 0) {
                    // 5. Save to DB
                    const questionsToSave = newQuestionsData.map(q => ({
                        question: q.question,
                        options: q.options,
                        correctAnswer: q.correct_answer,
                        explanation: q.explanation,
                        type: q.type || 'MCQ',
                        subject: subject,
                        topic: topic,
                        exam: examType,
                        difficulty: 'Medium',
                        isAiGenerated: true,
                        generatedFor: userId,
                        createdAt: new Date()
                    }));

                    await Question.insertMany(questionsToSave);
                    console.log(`[QuestionGenerator] ✅ Successfully generated and saved ${questionsToSave.length} questions for "${topic}"`);
                } else {
                    console.log(`[QuestionGenerator] ⚠️ AI returned no questions for "${topic}". Full Response:`, JSON.stringify(response.data, null, 2));
                }

            } catch (aiError) {
                console.error(`[QuestionGenerator] ❌ AI Service failed for "${topic}":`, aiError.message);
                if (aiError.response) {
                    console.error('AI Response Data:', aiError.response.data);
                }
            }
        }

        console.log('[QuestionGenerator] 🏁 Generation cycle completed.');

    } catch (error) {
        console.error('[QuestionGenerator] Critical Error:', error);
    }
};
