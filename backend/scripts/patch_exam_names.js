const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const Attempt = require('../models/Attempt');
const TestSession = require('../models/TestSession');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('✅ MongoDB Connected');

        // Update Attempts
        const attemptRes = await Attempt.updateMany(
            { examType: 'jee-main' },
            { $set: { examType: 'JEE Main' } }
        );
        console.log(`Updated ${attemptRes.modifiedCount} attempts from 'jee-main' to 'JEE Main'`);

        // Update Sessions
        const sessionRes = await TestSession.updateMany(
            { examType: 'jee-main' },
            { $set: { examType: 'JEE Main' } }
        );
        console.log(`Updated ${sessionRes.modifiedCount} sessions from 'jee-main' to 'JEE Main'`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
