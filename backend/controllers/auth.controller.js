const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Performance = require('../models/Performance');
const Attempt = require('../models/Attempt');
const TestSession = require('../models/TestSession');
const { BRANCHES } = require('../utils/constants');
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
        console.log('   branch received:', branch);
        console.log('   user._id:', user._id);

        if (targetExam) {
            try {
                // Normalize branch name to code if possible
                let branchCode = branch;
                if (branch && targetExam === 'GATE') {
                    // Check if branch is a full name (value in BRANCHES)
                    const entry = Object.entries(BRANCHES).find(([key, val]) => val === branch);
                    if (entry) {
                        branchCode = entry[0];
                    }
                }

                // Construct the correct exam name for Performance schema
                // If it's GATE, appended the branch (e.g., "GATE CS", "GATE DA")
                const perfExamName = (targetExam === 'GATE' && branchCode)
                    ? `GATE ${branchCode}`
                    : targetExam;

                console.log(`🔄 Attempting to initialize performance schema for exam: ${perfExamName}`);
                // Pass name to be stored in Performance document
                await Performance.initializeExamPerformance(user._id, perfExamName, name);
                console.log(`✅ Performance schema created for ${email} - Exam: ${perfExamName}`);
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

        // Track old exams to detect new additions (Normalize to "GATE <Branch>" format)
        // Track old exams to detect new additions (Normalize to "GATE <Branch>" format)
        const normalizeExamName = (exam) => {
            let type = exam.examType;
            let br = exam.branch;

            if (type === 'gate-cs') return 'GATE CS';
            if (type === 'jee-main') return 'JEE Main';

            if (type === 'GATE') {
                if (br) {
                    // Try to resolve full branch name to code
                    const entry = Object.entries(BRANCHES).find(([key, val]) => val === br);
                    const code = entry ? entry[0] : br; // Use code if found, else original (which might be code)
                    return `GATE ${code}`;
                }
                return 'GATE CS'; // Default if no branch?
            }
            return type;
        };

        const oldExamTypes = userProfile.exams.map(e => normalizeExamName(e));

        if (name) userProfile.name = name;
        if (profileImage) userProfile.profileImage = profileImage;

        let performanceInitResults = [];
        let removedExams = [];

        if (exams) {
            // Update profile exams
            // Note: We don't normalize 'type' in DB usually, but for performance init we need the formatted name
            userProfile.exams = exams;

            // Prepare normalized list of new exams to check against old ones
            const newExamListNormalized = exams.map(e => normalizeExamName(e));

            // Find which normalized exam names are NEW
            const addedExams = newExamListNormalized.filter(examName => !oldExamTypes.includes(examName));

            if (addedExams.length > 0) {
                console.log(`🔄 New exams detected: ${addedExams.join(', ')}`);
                console.log(`   User ID: ${req.user.id}`);

                try {
                    // addedExams already contains values like "GATE DA", "JEE Main", etc.
                    // Pass current user name (either updated 'name' or existing 'userProfile.name')
                    const currentName = name || userProfile.name;
                    performanceInitResults = await Performance.initializeMultipleExams(req.user.id, addedExams, currentName);
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

            // Detect REMOVED exams and perform cascading delete
            removedExams = oldExamTypes.filter(examName => !newExamListNormalized.includes(examName));

            if (removedExams.length > 0) {
                console.log(`🗑️  Removed exams detected: ${removedExams.join(', ')}`);
                console.log(`   User ID: ${req.user.id}`);

                for (const examName of removedExams) {
                    console.log(`   processing deletion for: ${examName}`);

                    // 1. Delete Attempts
                    // Filter by regex to capture variations (e.g. "GATE DA" from normalized name)
                    const attemptDelete = await Attempt.deleteMany({
                        userId: req.user.id,
                        examType: { $regex: new RegExp(`^${examName}`, 'i') }
                    });
                    console.log(`   - Deleted ${attemptDelete.deletedCount} attempts for ${examName}`);

                    // 2. Delete Test Sessions
                    const sessionDelete = await TestSession.deleteMany({
                        userId: req.user.id,
                        examType: { $regex: new RegExp(`^${examName}`, 'i') } // Using regex to be safe
                    });
                    console.log(`   - Deleted ${sessionDelete.deletedCount} test sessions for ${examName}`);

                    // 3. Update Performance Schema (Remove the exam key)
                    // Use specific key update for Map: "exams.GATE DA"
                    const perfUpdate = await Performance.updateOne(
                        { userId: req.user.id },
                        { $unset: { [`exams.${examName}`]: "" } }
                    );
                    console.log(`   - Performance schema update: ${perfUpdate.modifiedCount ? 'Success' : 'No change'}`);
                }
            }
        }

        await userProfile.save();

        // Send response with performance initialization status
        res.json({
            ...userProfile.toObject(),
            performanceInitialized: performanceInitResults.length > 0 ? performanceInitResults : undefined,
            removedExams: removedExams // Optional: inform client of what was removed
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).send('Server Error');
    }
};
