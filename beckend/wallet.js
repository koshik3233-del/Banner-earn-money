const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Click = require('../models/Click');
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');

// Record banner click
router.post('/click', auth, async (req, res) => {
    try {
        const { bannerId } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if user has clicked today
        if (req.user.lastClickDate) {
            const lastClick = new Date(req.user.lastClickDate);
            lastClick.setHours(0, 0, 0, 0);
            
            if (lastClick.getTime() === today.getTime()) {
                // Reset clicks if it's a new day
                if (req.user.clicksToday >= 50) { // Limit 50 clicks per day
                    return res.status(400).json({ error: 'Daily click limit reached' });
                }
            } else {
                req.user.clicksToday = 0;
            }
        }

        // Record click
        const click = new Click({
            userId: req.user._id,
            bannerId,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        });

        // Update user wallet
        req.user.walletBalance += 1;
        req.user.totalEarned += 1;
        req.user.clicksToday += 1;
        req.user.lastClickDate = new Date();

        await Promise.all([click.save(), req.user.save()]);

        res.json({
            message: 'Click recorded successfully',
            walletBalance: req.user.walletBalance,
            clicksToday: req.user.clicksToday
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get wallet info
router.get('/balance', auth, async (req, res) => {
    res.json({
        walletBalance: req.user.walletBalance,
        totalEarned: req.user.totalEarned,
        clicksToday: req.user.clicksToday
    });
});

// Request withdrawal
router.post('/withdraw', auth, async (req, res) => {
    try {
        const { amount, method, upiId, bankDetails } = req.body;

        // Check minimum amount
        if (amount < 100) {
            return res.status(400).json({ error: 'Minimum withdrawal amount is ₹100' });
        }

        // Check sufficient balance
        if (req.user.walletBalance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Check payment method details
        if (method === 'UPI' && !upiId && !req.user.upiId) {
            return res.status(400).json({ error: 'UPI ID required' });
        }

        if (method === 'Bank' && !bankDetails && !req.user.bankAccount) {
            return res.status(400).json({ error: 'Bank details required' });
        }

        // Create withdrawal request
        const withdrawal = new Withdrawal({
            userId: req.user._id,
            amount,
            method,
            upiId: upiId || req.user.upiId,
            bankDetails: bankDetails || req.user.bankAccount,
            status: 'Pending'
        });

        // Deduct from wallet
        req.user.walletBalance -= amount;
        
        await Promise.all([withdrawal.save(), req.user.save()]);

        res.json({
            message: 'Withdrawal request submitted successfully',
            withdrawalId: withdrawal._id,
            currentBalance: req.user.walletBalance
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get withdrawal history
router.get('/withdrawals', auth, async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ withdrawals });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get click history
router.get('/clicks', auth, async (req, res) => {
    try {
        const clicks = await Click.find({ userId: req.user._id })
            .sort({ timestamp: -1 })
            .limit(100)
            .select('-ipAddress -userAgent');

        res.json({ clicks });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});