const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
    transId: Number,
    phone: { type: String, required: true },
    receiver: { type: String, required: true },
    firstMoney: Number,
    amount: Number,
    lastMoney: Number,
    comment: String
}, { timestamps: true })

module.exports = mongoose.model('transfer', transferSchema);