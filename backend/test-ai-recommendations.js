require('dotenv').config();
const mongoose = require('mongoose');
const Performance = require('./models/Performance');

async function testAIRecommendations() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('Connected to MongoDB\n');

        const performance = await Performance.findOne();
        if (!performance) {
            console.log('No performance data found');
            process.exit(0);
        }

        const examName = 'JEE Main';
        const examStats = performance.exams.get(examName);

        if (!examStats) {
            console.log('No exam data for', examName);
            process.exit(0);
        }

        console.log('🔍 Analyzing Performance Data for AI Recommendations\n');

        // Helper function to calculate weakness score
        const calculateWeaknessScore = (stats) => {
            if (stats.totalAttempted === 0) return 50;
            const accuracyFactor = (100 - stats.accuracy) * 0.7;
            const strengthFactor = (100 - stats.strength) * 0.3;
            return Math.round(accuracyFactor + strengthFactor);
        };

        // 1. Find weak topics (accuracy < 60% or strength < 50)
        console.log('📝 WEAK TOPICS (for Practice Tests):');
        const weakTopics = [];
        for (const [topicName, stats] of examStats.topicStats.entries()) {
            if (stats.totalAttempted > 0 && (stats.accuracy < 60 || stats.strength < 50)) {
                const weaknessScore = calculateWeaknessScore(stats);
                weakTopics.push({
                    name: topicName,
                    accuracy: stats.accuracy,
                    strength: stats.strength,
                    weaknessScore,
                    totalAttempted: stats.totalAttempted
                });
            }
        }
        weakTopics.sort((a, b) => b.weaknessScore - a.weaknessScore);

        console.log(`Found ${weakTopics.length} weak topics:`);
        weakTopics.slice(0, 5).forEach(t => {
            console.log(`  - ${t.name}: ${t.accuracy.toFixed(1)}% accuracy, ${t.strength.toFixed(1)} strength, weakness score: ${t.weaknessScore}`);
        });

        // 2. Find weak subjects (accuracy < 70%)
        console.log('\n📚 WEAK SUBJECTS (for Subject Tests):');
        const weakSubjects = [];
        for (const [subjectName, stats] of examStats.subjectStats.entries()) {
            if (stats.totalAttempted > 0 && stats.accuracy < 70) {
                weakSubjects.push({
                    subject: subjectName,
                    accuracy: Math.round(stats.accuracy),
                    strength: Math.round(stats.strength),
                    totalAttempted: stats.totalAttempted
                });
            }
        }
        weakSubjects.sort((a, b) => a.accuracy - b.accuracy);

        console.log(`Found ${weakSubjects.length} weak subjects:`);
        weakSubjects.forEach(s => {
            console.log(`  - ${s.subject}: ${s.accuracy}% accuracy, ${s.strength} strength`);
        });

        // 3. Find topics for topic tests (accuracy < 70%)
        console.log('\n🎯 TOPICS FOR FOCUSED PRACTICE:');
        const topicTests = [];
        for (const [topicName, stats] of examStats.topicStats.entries()) {
            if (stats.totalAttempted > 0 && stats.accuracy < 70) {
                let priority = 'Medium';
                if (stats.accuracy < 40) priority = 'Critical';
                else if (stats.accuracy < 55) priority = 'High';

                topicTests.push({
                    topic: topicName,
                    accuracy: Math.round(stats.accuracy),
                    strength: Math.round(stats.strength),
                    priority,
                    totalAttempted: stats.totalAttempted
                });
            }
        }

        const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2 };
        topicTests.sort((a, b) => {
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return a.accuracy - b.accuracy;
        });

        console.log(`Found ${topicTests.length} topics for practice:`);
        topicTests.slice(0, 6).forEach(t => {
            console.log(`  - ${t.topic}: ${t.accuracy}% accuracy, ${t.strength} strength [${t.priority} Priority]`);
        });

        console.log('\n✅ AI Recommendations would generate:');
        console.log(`   - ${Math.min(2, Math.floor(weakTopics.length / 3))} Practice Tests (mixed topics)`);
        console.log(`   - ${weakSubjects.length} Subject Tests`);
        console.log(`   - ${Math.min(6, topicTests.length)} Topic Tests`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

testAIRecommendations();
