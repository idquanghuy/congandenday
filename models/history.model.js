const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    io: Number,
    transId: Number,
    phone: String,
    money: Number,
    bonus: Number,
    postBalance: Number,
    comment: String,
    partnerId: String,
    partnerName: String,
    targetId: String,
    targetName: String,
    gameName: String,
    gameType: String,
    description: String,
    status: { type: String, default: 'wait' },
    timeTLS: Date
}, { timestamps: true })

historySchema.index({ transId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('History', historySchema);