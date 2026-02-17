const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Bad JSON:', err.message);
        return res.status(400).send({ message: 'Invalid JSON payload' });
    }
    next();
});

// Serve static files from uploads directory
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DB_NAME })
    .then(() => console.log(`✅ MongoDB Connected to ${process.env.DB_NAME}`))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes Configuration (Placeholder used until routes are created)
app.get('/', (req, res) => {
    res.send('Mockup Backend is Running');
});

// Import Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/questions', require('./routes/question.routes'));
app.use('/api/attempts', require('./routes/attempt.routes'));
app.use('/api/analysis', require('./routes/analysis.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/test', require('./routes/test.routes'));
app.use('/api/ai', require('./routes/ai.routes'));



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
