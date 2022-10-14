const mongoose = require('mongoose');

const historyJackpot = new mongoose.Schema({
    transId: { type: String, unique: true },
    receiver: String,
    amount: Number,
    status: { type: String, default: 'success' }
}, { timestamps: true })

module.exports = mongoose.model('history-jackpot', historyJackpot);