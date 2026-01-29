const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const Performance = require('../models/Performance');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        const perf = await Performance.findOne({ userId: '697917498b016209a6e84eb3' });
        const stats = perf.exams.get('JEE Main').topicStats.get('Chemical Bonding');
        console.log(`Topic: Chemical Bonding`);
        console.log(`Strength: ${stats.strength}`);
        console.log(`Accuracy: ${stats.accuracy}`);
        console.log(`Attempted: ${stats.totalAttempted}`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
