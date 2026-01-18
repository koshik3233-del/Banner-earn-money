const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');
const Click = require('../models/Click');

// Get all users
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });
        
        res.json({ users });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all withdrawal requests
router.get('/withdrawals', adminAuth, async (req, res) => {
    try {
        const withdrawals = await Withdrawal.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        
        res.json({ withdrawals });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update withdrawal status
router.put('/withdrawals/:id', adminAuth, async (req, res) => {
    try {
        const { status, transactionId, adminNotes } = req.body;
        
        const withdrawal = await Withdrawal.findById(req.params.id);
        
        if (!withdrawal) {
            return res.status(404).json({ error: 'Withdrawal not found' });
        }

        withdrawal.status = status;
        if (transactionId) withdrawal.transactionId = transactionId;
        if (adminNotes) withdrawal.adminNotes = adminNotes;
        
        if (status === 'Approved' || status === 'Completed') {
            withdrawal.processedAt = new Date();
        }

        await withdrawal.save();
        
        res.json({ message: 'Withdrawal updated successfully', withdrawal });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get statistics
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalClicks = await Click.countDocuments();
        const totalWithdrawals = await Withdrawal.countDocuments();
        const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'Pending' });
        const totalAmountWithdrawn = await Withdrawal.aggregate([
            { $match: { status: 'Completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            totalUsers,
            totalClicks,
            totalWithdrawals,
            pendingWithdrawals,
            totalAmountWithdrawn: totalAmountWithdrawn[0]?.total || 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});