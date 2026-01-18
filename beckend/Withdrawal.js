const mongoose = require('mongoose');

const WithdrawalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 100
    },
    method: {
        type: String,
        enum: ['UPI', 'Bank'],
        required: true
    },
    upiId: {
        type: String
    },
    bankDetails: {
        accountNumber: String,
        ifscCode: String,
        accountHolder: String
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
        default: 'Pending'
    },
    transactionId: {
        type: String
    },
    adminNotes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    processedAt: {
        type: Date
    }
});

module.exports = mongoose.model('Withdrawal', WithdrawalSchema);