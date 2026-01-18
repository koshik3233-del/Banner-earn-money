const mongoose = require('mongoose');

const ClickSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bannerId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        default: 1
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Click', ClickSchema);