const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const TestSession = require('../models/TestSession');
const Attempt = require('../models/Attempt');
const Performance = require('../models/Performance');
const testController = require('../controllers/test.controller');

const run = async () => {
    let tempUser = null;
    let sessionId = null;

    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('✅ MongoDB Connected');

        // 1. Create Temp User
        tempUser = new User({
            name: 'TestUser_SubmitBug',
            email: `test_submit_${Date.now()}@test.com`,
            password: 'password123',
            role: 'student'
        });
        await tempUser.save();
        console.log(`👤 Created Temp User: ${tempUser._id}`);

        // 2. Start Topic Test
        const startReq = {
            user: { id: tempUser._id },
            body: {
                topic: "Basics Of Organic Chemistry",
                examType: "jee-main"
            }
        };
        const startRes = {
            status: function (code) { this.statusCode = code; return this; },
            json: function (data) { this.data = data; return this; }
        };

        console.log("🧪 Starting Topic Test...");
        await testController.startTopicTest(startReq, startRes);

        if (startRes.statusCode !== 201) {
            throw new Error(`Failed to start test: ${startRes.data.message}`);
        }
        sessionId = startRes.data.sessionId;
        console.log(`✅ Session Started: ${sessionId}`);

        // 3. Submit Test (Immediately)
        const submitReq = {
            params: { sessionId },
            user: { id: tempUser._id }
        };
        const submitRes = {
            status: function (code) { this.statusCode = code; return this; },
            json: function (data) { this.data = data; return this; }
        };

        console.log("🧪 Submitting Test...");
        await testController.submitTest(submitReq, submitRes);

        if (submitRes.statusCode === 200 || !submitRes.statusCode) { // 200 is default usually
            console.log("✅ Submission Successful!");
            console.log("Response:", submitRes.data);

            // 4. Verify Attempt
            const attempt = await Attempt.findOne({ testSessionId: sessionId });
            if (attempt && attempt.topic === "Basics Of Organic Chemistry") {
                console.log("🎉 SUCCESS: Attempt saved with correct topic!");
            } else {
                console.error("❌ FAILURE: Attempt missing or wrong topic", attempt);
            }

            // 5. Verify Performance
            const perf = await Performance.findOne({ userId: tempUser._id });

            // Normalize verify key (Backend normalizes jee-main -> JEE Main)
            const examKey = "JEE Main";
            const examData = perf.exams.get(examKey);

            if (examData) {
                const topicStats = examData.topicStats.get("Basics Of Organic Chemistry");
                if (topicStats) {
                    console.log("🎉 SUCCESS: Performance updated for topic!", topicStats);
                } else {
                    console.error("❌ FAILURE: Performance found but Topic stats missing", examData.topicStats);
                }
            } else {
                console.error(`❌ FAILURE: Exam data not found for ${examKey}`, perf.exams);
            }

        } else {
            console.error("❌ Submission Failed:", submitRes.statusCode, submitRes.data);
        }

    } catch (error) {
        console.error('❌ Script Error:', error);
    } finally {
        // Cleanup
        if (sessionId) await TestSession.findByIdAndDelete(sessionId);
        if (tempUser) {
            await Performance.deleteOne({ userId: tempUser._id });
            await Attempt.deleteMany({ userId: tempUser._id });
            await User.deleteOne({ _id: tempUser._id });
        }
        console.log("🧹 Cleanup Done");
        await mongoose.disconnect();
    }
};

run();
