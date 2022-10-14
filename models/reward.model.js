const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
    gameType: String,
    content: String,
    numberTLS: Array,
    amount: Number,
    resultType: { type: String, default: 'end' }
}, { timestamps: true })

module.exports = mongoose.model('Reward', rewardSchema);