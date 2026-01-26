const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const controller = require('../controllers/analysis.controller');

// Mock Request and Response
const req = {
    user: { id: '6977c31f94f60719f8822669' }, // User ID from previously
    query: { exam: 'gate-cs' },
    params: {} // getTopicAnalysis usually doesn't stick to params if query is used?
    // Wait, route is /:examName/topics? But controller usage:
    // "const { exam } = req.query;"
    // "let examName;"
    // logic prioritizes req.query.exam
};

const res = {
    json: (data) => {
        console.log('\n--- RESPONSE JSON ---');
        // Analyze the keys of groupedBySubject
        if (data.groupedBySubject) {
            console.log('Grouped Subjects:', Object.keys(data.groupedBySubject));
            Object.entries(data.groupedBySubject).forEach(([subj, list]) => {
                console.log(`${subj}: ${list.length} topics`);
            });
        } else {
            console.log('No groupedBySubject found!');
        }
        // console.log(JSON.stringify(data, null, 2));
    },
    status: (code) => ({
        json: (data) => console.log(`Status ${code}:`, data),
        send: (msg) => console.log(`Status ${code}:`, msg)
    })
};

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME });
        console.log('Connected. Triggering Controller...');

        await controller.getTopicAnalysis(req, res);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
