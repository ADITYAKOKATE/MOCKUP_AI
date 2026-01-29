const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const Question = require('../models/Question');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('✅ MongoDB Connected');

        // 1. Check Distinct Exam Types
        const exams = await Question.distinct("exam");
        console.log("🎓 Distinct Exam Types in DB:", exams);

        // 2. Check specific topic from the error log
        const targetTopic = "Aldehydes Ketones And Carboxylic Acids";
        const topicStats = await Question.aggregate([
            { $match: { topic: targetTopic } },
            {
                $group: {
                    _id: { topic: "$topic", exam: "$exam" }, // Group by BOTH topic and exam
                    total: { $sum: 1 },
                    aiCount: { $sum: { $cond: [{ $eq: ["$isAiGenerated", true] }, 1, 0] } }
                }
            }
        ]);

        console.log(`\n🔍 Search Results for "${targetTopic}":`);
        if (topicStats.length === 0) {
            console.log("   ❌ No questions found for this topic (exact match).");

            // Try fuzzy search to see if it exists with slight var
            const fuzzy = await Question.find({ topic: { $regex: "Aldehyde", $options: 'i' } }).limit(1);
            if (fuzzy.length > 0) console.log(`   💡 Did find: "${fuzzy[0].topic}" (Exam: ${fuzzy[0].exam})`);
        } else {
            console.table(topicStats);
        }

    } catch (error) {
        console.error('❌ Script Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
