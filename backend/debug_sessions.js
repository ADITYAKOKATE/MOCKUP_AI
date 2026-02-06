const mongoose = require('mongoose');
const TestSession = require('./models/TestSession');
require('dotenv').config();

const checkSessions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // I need the user ID. I'll search for active sessions generically first or try to find the user.
        // Since I don't have the user ID handy from the context explicitly without digging, 
        // I'll list ALL active sessions and grouped by user.

        const activeSessions = await TestSession.find({ status: 'active' });
        console.log(`DEBUG: Total Active Sessions Found: ${activeSessions.length}`);

        const userMap = {};
        activeSessions.forEach(s => {
            const uid = s.userId.toString();
            if (!userMap[uid]) userMap[uid] = [];
            userMap[uid].push(s._id);
        });

        if (Object.keys(userMap).length === 0) {
            console.log("No active sessions found for any user.");
        }

        for (const [uid, sessions] of Object.entries(userMap)) {
            console.log(`User ${uid} has ${sessions.length} active sessions:`);
            console.log(JSON.stringify(sessions, null, 2));
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        await mongoose.disconnect();
        console.log('Disconnected');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkSessions();
