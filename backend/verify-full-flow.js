const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';
// Helper to get auth token
// Since we don't have login, we'll implement a quick login or create user
// Actually, let's just use the seed user if exists or register one.

async function runVerification() {
    try {
        console.log("1. Registering/Logging in User...");
        let token;
        const email = "testuser@example.com";
        const password = "password123";

        try {
            console.log("   Attempting to register...");
            const res = await axios.post(`${BASE_URL}/auth/register`, {
                name: "Test User",
                email,
                password
            });
            token = res.data.token;
        } catch (e) {
            console.log("   User exists, logging in...");
            const res = await axios.post(`${BASE_URL}/auth/login`, {
                email,
                password
            });
            token = res.data.token;
        }

        const headers = { 'x-auth-token': token };

        console.log("2. Starting Full Test (JEE Main)...");

        // 1. Try to discard any existing session first (brute force cleanup)
        // We can't discard without ID, so let's try to start, if it fails, we get ID and discard.
        let sessionId, questions;

        try {
            const res = await axios.post(`${BASE_URL}/test/start-full-test`, { examType: "JEE Main" }, { headers });
            sessionId = res.data.sessionId;
            questions = res.data.questions;
        } catch (e) {
            if (e.response && e.response.status === 400 && e.response.data.sessionId) {
                console.log("   Active session found, discarding...");
                await axios.post(`${BASE_URL}/test/session/${e.response.data.sessionId}/discard`, {}, { headers });

                // Retry start
                console.log("   Retrying start...");
                const res = await axios.post(`${BASE_URL}/test/start-full-test`, { examType: "JEE Main" }, { headers });
                sessionId = res.data.sessionId;
                questions = res.data.questions;
            } else {
                throw e;
            }
        }

        console.log(`   Session Started: ${sessionId}`);
        console.log(`   Questions Received: ${questions.length}`);

        const q1 = questions[0];
        const q2 = questions[1];

        console.log(`\n3. Answering Question 1 (MCQ) - Option B (Label: B)`);
        console.log(`   Q1 ID: ${q1.id}, Type: ${q1.type}`);
        // Simulate selecting Option B
        await axios.post(`${BASE_URL}/test/session/${sessionId}/response`, {
            questionId: q1.id,
            answer: "B",
            timeTaken: 5
        }, { headers });

        console.log(`\n4. Answering Question 2 (MCQ) - Option A (Label: A)`);
        // Simulate selecting Option A
        await axios.post(`${BASE_URL}/test/session/${sessionId}/response`, {
            questionId: q2.id,
            answer: "A",
            timeTaken: 10
        }, { headers });

        console.log(`\n5. Updating Time Only for Q1 (Simulate switch back)`);
        // Simulate switching back to Q1 and spending 2 more seconds (Total 7s), WITHOUT sending answer
        // Note: Frontend sends answer normally, but let's test the "Undefined Answer" case too
        // Actually frontend sends currentData.answer.
        // Let's send answer as "B" again to match frontend behavior
        await axios.post(`${BASE_URL}/test/session/${sessionId}/response`, {
            questionId: q1.id,
            answer: "B",
            timeTaken: 7
        }, { headers });

        console.log(`\n6. Submitting Test...`);
        const submitRes = await axios.post(`${BASE_URL}/test/session/${sessionId}/submit`, {}, { headers });
        const results = submitRes.data;
        console.log(`   Test Submitted. Score: ${results.score}`);
        console.log(`   Attempt ID: ${results.attemptId}`);
        console.log(`   Total Time Taken: ${results.totalTimeTaken} (Type: ${typeof results.totalTimeTaken})`);
        console.log(`   Subject Wise Keys: ${Object.keys(results.subjectWise || {}).join(', ')}`);
        console.log(`   Subject Wise Data Sample: ${JSON.stringify(results.subjectWise || {})}`);

        console.log(`\n7. Verifying Stored Answers...`);
        const attemptRes = await axios.get(`${BASE_URL}/test/results/${results._id || results.attemptId}`, { headers });
        const finalQuestions = attemptRes.data.questions;

        const a1 = finalQuestions.find(q => q.questionId === q1.id);
        const a2 = finalQuestions.find(q => q.questionId === q2.id);

        console.log("\n--- Verification Report ---");
        console.log(`Q2 Expected: Answer="A", Time=10. Actual: Answer=${a2.userAnswer}, Time=${a2.timeTaken}`);
        console.log(`Q2 Correct Answer in DB: ${a2.correctAnswer}`);
        console.log(`Q2 isCorrect: ${a2.isCorrect}`);

        console.log("\n8. Verifying History API...");
        const historyRes = await axios.get(`${BASE_URL}/test/history`, { headers });
        console.log(`   History Status: ${historyRes.status}`);
        console.log(`   History Count: ${historyRes.data.length}`);
        if (historyRes.data.length > 0) {
            const latest = historyRes.data[0];
            console.log(`   Latest Attempt Score: ${latest.score}`);
            console.log(`   Latest Attempt TotalMarks: ${latest.totalMarks}`); // Checking missing field
        } else {
            console.log("   ERROR: History is empty after submission!");
        }

    } catch (error) {
        console.error("Verification Failed:", error.response ? error.response.data : error.message);
    }
}

runVerification();
