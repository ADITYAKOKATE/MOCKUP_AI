require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function verifyHistory() {
    try {
        console.log("1. Logging in...");
        // Login
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: process.env.TEST_EMAIL || "aditya@test.com",
            password: process.env.TEST_PASSWORD || "123456"
        });
        const token = loginRes.data.token;
        const headers = { 'x-auth-token': token };
        console.log("   Logged in.");

        console.log("\n2. Fetching History...");
        const res = await axios.get(`${BASE_URL}/test/history`, { headers });
        console.log("   Status:", res.status);
        console.log("   Data Type:", Array.isArray(res.data) ? "Array" : typeof res.data);
        console.log("   Count:", res.data.length);
        if (res.data.length > 0) {
            console.log("   First Item Exam:", res.data[0].examType);
            console.log("   First Item Score:", res.data[0].score);
        } else {
            console.log("   History is EMPTY.");
        }

    } catch (error) {
        console.error("FAILED:", error.response?.data || error.message);
    }
}

verifyHistory();
