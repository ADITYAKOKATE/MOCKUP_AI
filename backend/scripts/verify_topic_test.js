const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const TestSession = require('../models/TestSession');
const testController = require('../controllers/test.controller');

const run = async () => {
    let tempUser = null;
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('✅ MongoDB Connected');

        // 1. Create Temp User
        tempUser = new User({
            name: 'TestUser_TopicAI',
            email: `test_topic_ai_${Date.now()} @test.com`,
            password: 'password123',
            role: 'student'
        });
        await tempUser.save();
        console.log(`👤 Created Temp User: ${tempUser._id} `);

        // 2. Mock Request and Response
        const req = {
            user: { id: tempUser._id },
            body: {
                topic: "Basics Of Organic Chemistry",
                examType: "jee-main" // Test lowercase/slug format
            }
        };

        const res = {
            status: function (code) {
                this.statusCode = code;
                return this;
            },
            json: function (data) {
                this.data = data;
                return this;
            }
        };

        console.log("🧪 Invoking startTopicTest controller directly...");
        await testController.startTopicTest(req, res);

        // 3. Verify Response
        if (res.statusCode === 201) {
            console.log("✅ Controller returned 201 Created");
            console.log(`🆔 Session ID: ${res.data.sessionId} `);
            console.log(`📊 Questions: ${res.data.questions.length} `);

            // Check DB Session
            const session = await TestSession.findById(res.data.sessionId).populate('questions.questionId');
            const dbAiCount = session.questions.filter(q => q.questionId.isAiGenerated).length;

            console.log(`🤖 AI Questions in Session: ${dbAiCount} `);
            console.log(`📚 Standard Questions in Session: ${session.questions.length - dbAiCount} `);

            if (dbAiCount > 0) {
                console.log("🎉 SUCCESS: AI Questions included!");
            } else {
                console.log("⚠️ WARNING: No AI questions included (maybe none existed in DB?)");
            }

            // Cleanup Session
            await TestSession.findByIdAndDelete(res.data.sessionId);
            console.log("🧹 Cleanup: Deleted test session");
        } else {
            console.error("❌ Controller Failed:", res.statusCode, res.data);
        }

    } catch (error) {
        console.error('❌ Script Error:', error);
    } finally {
        if (tempUser) {
            await User.deleteOne({ _id: tempUser._id });
            console.log("🧹 Cleanup: Deleted temp user");
        }
        await mongoose.disconnect();
    }
};

run();
