const mongoose = require('mongoose');

const jackpotSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true },
    amount: {type: Number, default: 0},
    isJoin: { type: Number, default: 1 },
    ip: String
}, { timestamps: true })

module.exports = mongoose.model('Jackpot', jackpotSchema);