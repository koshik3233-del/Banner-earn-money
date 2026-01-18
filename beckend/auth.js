const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create user
        user = new User({
            name,
            email,
            password
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                walletBalance: user.walletBalance,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                walletBalance: user.walletBalance,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            walletBalance: req.user.walletBalance,
            totalEarned: req.user.totalEarned,
            clicksToday: req.user.clicksToday,
            upiId: req.user.upiId,
            bankAccount: req.user.bankAccount,
            isAdmin: req.user.isAdmin
        }
    });
});

// Update profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { upiId, bankAccount } = req.body;
        
        if (upiId) req.user.upiId = upiId;
        if (bankAccount) req.user.bankAccount = bankAccount;
        
        await req.user.save();
        
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;