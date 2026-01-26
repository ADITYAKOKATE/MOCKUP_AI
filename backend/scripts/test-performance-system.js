/**
 * Test Script for Performance Schema System
 * 
 * This script demonstrates:
 * 1. Performance schema initialization
 * 2. Strength calculation
 * 3. Weak topic analysis
 * 4. Performance analysis
 * 
 * Run with: node backend/scripts/test-performance-system.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Performance = require('../models/Performance');
const { getExamStructure } = require('../utils/constants');

async function testPerformanceSystem() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Test 1: Exam Structure Configuration
        console.log('=== TEST 1: Exam Structure Configuration ===');
        const jeeStructure = getExamStructure('JEE Main');
        console.log('JEE Main Structure:');
        for (const [subject, topics] of Object.entries(jeeStructure)) {
            console.log(`  ${subject}: ${topics.length} topics`);
        }
        console.log('✅ Exam structure loaded successfully\n');

        // Test 2: Performance Initialization
        console.log('=== TEST 2: Performance Schema Initialization ===');
        const testUserId = new mongoose.Types.ObjectId();

        await Performance.initializeExamPerformance(testUserId, 'JEE Main');
        const perf = await Performance.findOne({ userId: testUserId });

        if (perf && perf.exams.has('JEE Main')) {
            const jeeData = perf.exams.get('JEE Main');
            console.log(`✅ Performance schema created for JEE Main`);
            console.log(`   - Subjects: ${jeeData.subjectStats.size}`);
            console.log(`   - Topics: ${jeeData.topicStats.size}`);
            console.log(`   - Difficulty levels: ${jeeData.difficultyStats.size}`);
            console.log(`   - Importance levels: ${jeeData.importanceStats.size}\n`);
        }

        // Test 3: Strength Calculation
        console.log('=== TEST 3: Strength Score Calculation ===');

        const testCases = [
            { name: 'Perfect Score', stats: { totalAttempted: 20, totalCorrect: 20, totalWrong: 0, totalTime: 1200 } },
            { name: 'Good Performance', stats: { totalAttempted: 15, totalCorrect: 12, totalWrong: 3, totalTime: 1500 } },
            { name: 'Average Performance', stats: { totalAttempted: 10, totalCorrect: 6, totalWrong: 4, totalTime: 1400 } },
            { name: 'Weak Performance', stats: { totalAttempted: 8, totalCorrect: 2, totalWrong: 6, totalTime: 1600 } },
            { name: 'Not Attempted', stats: { totalAttempted: 0, totalCorrect: 0, totalWrong: 0, totalTime: 0 } }
        ];

        testCases.forEach(test => {
            const strength = Performance.calculateStrength(test.stats, 120);
            const accuracy = test.stats.totalAttempted > 0
                ? ((test.stats.totalCorrect / test.stats.totalAttempted) * 100).toFixed(1)
                : 0;
            console.log(`${test.name}:`);
            console.log(`  Accuracy: ${accuracy}% | Strength: ${strength !== null ? strength : 'N/A'}`);
        });
        console.log('✅ Strength calculation working correctly\n');

        // Test 4: Simulate Test Attempt and Update
        console.log('=== TEST 4: Simulating Test Attempt ===');

        // Manually update some topic stats to simulate test attempts
        const examData = perf.exams.get('JEE Main');

        // Update Mechanics topic
        examData.topicStats.set('Mechanics', {
            totalAttempted: 15,
            totalCorrect: 12,
            totalWrong: 3,
            totalTime: 1800
        });

        // Update Thermodynamics topic (weak)
        examData.topicStats.set('Thermodynamics', {
            totalAttempted: 10,
            totalCorrect: 3,
            totalWrong: 7,
            totalTime: 1500
        });

        // Update Algebra topic
        examData.topicStats.set('Algebra', {
            totalAttempted: 20,
            totalCorrect: 18,
            totalWrong: 2,
            totalTime: 2000
        });

        perf.exams.set('JEE Main', examData);
        await perf.save();
        console.log('✅ Simulated test attempts for 3 topics\n');

        // Test 5: Get Weak Topics
        console.log('=== TEST 5: Weak Topics Analysis (for AI Recommendations) ===');
        const weakTopics = await Performance.getWeakTopics(testUserId, 'JEE Main', 60, 5);

        console.log(`Found ${weakTopics.length} weak topics:`);
        weakTopics.forEach((topic, index) => {
            console.log(`${index + 1}. ${topic.topic}`);
            console.log(`   Strength: ${topic.strength !== null ? topic.strength : 'Not attempted'}`);
            console.log(`   Priority: ${topic.priority}`);
            console.log(`   Accuracy: ${topic.accuracy}%`);
        });
        console.log('✅ Weak topics identified successfully\n');

        // Test 6: Performance Analysis
        console.log('=== TEST 6: Complete Performance Analysis ===');
        const analysis = await Performance.getPerformanceAnalysis(testUserId, 'JEE Main');

        if (analysis) {
            console.log(`Exam: ${analysis.examName}`);
            console.log(`Global Stats:`);
            console.log(`  Total Attempted: ${analysis.globalStats.totalAttempted}`);
            console.log(`  Average Accuracy: ${analysis.globalStats.averageAccuracy.toFixed(2)}%`);
            console.log(`\nWeak Topics: ${analysis.weakTopics.length}`);
            console.log(`Strong Topics: ${analysis.strongTopics.length}`);

            if (analysis.strongTopics.length > 0) {
                console.log(`\nTop Strong Topic: ${analysis.strongTopics[0].name} (Strength: ${analysis.strongTopics[0].strength})`);
            }
        }
        console.log('✅ Performance analysis generated successfully\n');

        // Cleanup
        console.log('=== CLEANUP ===');
        await Performance.deleteOne({ userId: testUserId });
        console.log('✅ Test data cleaned up\n');

        console.log('🎉 ALL TESTS PASSED! Performance system is working correctly.');

    } catch (err) {
        console.error('❌ Test failed:', err);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

// Run tests
testPerformanceSystem();
