const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Performance = require('../models/Performance');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { name, email, password, targetExam, branch, profileImage } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create User
        user = new User({
            email,
            password: hashedPassword
        });
        await user.save();

        // Create User Profile
        const userProfile = new UserProfile({
            userId: user._id,
            name,
            exams: [{
                examType: targetExam,
                branch: (targetExam === 'GATE') ? branch : null
            }],
            profileImage
        });
        await userProfile.save();

        // Initialize Performance Schema for the selected exam
        console.log('🔍 Checking performance initialization...');
        console.log('   targetExam received:', targetExam);
        console.log('   user._id:', user._id);

        if (targetExam) {
            try {
                console.log(`🔄 Attempting to initialize performance schema for exam: ${targetExam}`);
                await Performance.initializeExamPerformance(user._id, targetExam);
                console.log(`✅ Performance schema created for ${email} - Exam: ${targetExam}`);
            } catch (perfErr) {
                console.error('❌ Error initializing performance schema:', perfErr);
                console.error('   Stack trace:', perfErr.stack);
                // Don't fail registration if performance init fails
            }
        } else {
            console.log('⚠️  No targetExam provided - skipping performance initialization');
        }


        // Generate Token
        const payload = {
            user: {
                id: user._id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '30d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Generate Token
        const payload = {
            user: {
                id: user._id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '30d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        const profile = await UserProfile.findOne({ userId: req.user.id });
        res.json({ ...user.toObject(), profile });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
exports.updateProfile = async (req, res) => {
    try {
        const { name, profileImage, exams } = req.body;

        const userProfile = await UserProfile.findOne({ userId: req.user.id });
        if (!userProfile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Track old exams to detect new additions
        const oldExamTypes = userProfile.exams.map(e => e.examType);

        if (name) userProfile.name = name;
        if (profileImage) userProfile.profileImage = profileImage;

        let performanceInitResults = [];

        if (exams) {
            // Normalize exam types
            exams.forEach(e => {
                if (e.examType === 'GATE') e.examType = 'GATE CS';
                if (e.examType === 'gate-cs') e.examType = 'GATE CS';
                if (e.examType === 'jee-main') e.examType = 'JEE Main';
            });
            userProfile.exams = exams;

            // Initialize performance schemas for newly added exams
            const newExamTypes = exams.map(e => e.examType);
            const addedExams = newExamTypes.filter(examType => !oldExamTypes.includes(examType));

            if (addedExams.length > 0) {
                console.log(`🔄 New exams detected: ${addedExams.join(', ')}`);
                console.log(`   User ID: ${req.user.id}`);

                try {
                    performanceInitResults = await Performance.initializeMultipleExams(req.user.id, addedExams);
                    console.log(`✅ Performance schemas initialized successfully:`);
                    performanceInitResults.forEach(result => {
                        console.log(`   - ${result.examName}: ${result.success ? '✓' : '✗'}`);
                    });
                } catch (perfErr) {
                    console.error('❌ Error initializing performance schemas:', perfErr);
                    console.error('   Stack trace:', perfErr.stack);
                    // Don't fail profile update if performance init fails, but log it
                    performanceInitResults = addedExams.map(examName => ({
                        examName,
                        success: false,
                        error: perfErr.message
                    }));
                }
            }
        }

        await userProfile.save();

        // Send response with performance initialization status
        res.json({
            ...userProfile.toObject(),
            performanceInitialized: performanceInitResults.length > 0 ? performanceInitResults : undefined
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).send('Server Error');
    }
};
