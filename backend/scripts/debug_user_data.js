const mongoose = require('mongoose');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Performance = require('../models/Performance');
require('dotenv').config();

const inspectUserData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME || 'loop' });
        console.log('Connected to MongoDB');

        // Find the most recently active user or a specific user if known
        // For now, let's list all users with profiles and picking the first one or logic to find the "current" user
        // user.profile.exams will help us identify.

        const targetEmail = 'prathmeshbhoir9304@gmail.com';
        const user = await User.findOne({ email: targetEmail });

        if (!user) {
            console.log(`User ${targetEmail} not found! Listing all emails:`);
            const allUsers = await User.find({});
            allUsers.forEach(u => console.log(` - ${u.email}`));
            return;
        }

        console.log(`\n--- FOUND TARGET USER: ${user.email} (ID: ${user._id}) ---`);

        const profile = await UserProfile.findOne({ userId: user._id });
        if (profile) {
            console.log('Profile Exams:', JSON.stringify(profile.exams, null, 2));
        } else {
            console.log('No UserProfile found.');
        }

        const perf = await Performance.findOne({ userId: user._id });
        if (perf) {
            console.log('Performance Keys found in DB:', Array.from(perf.exams.keys()));
            for (const key of perf.exams.keys()) {
                if (key.startsWith('GATE')) {
                    const stats = perf.exams.get(key);
                    console.log(`Stats for [${key}]: Attempted=${stats.globalStats?.totalAttempted}, Correct=${stats.globalStats?.totalCorrect}`);
                }
            }
        } else {
            console.log('No Performance data found.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

inspectUserData();
