const mongoose = require('mongoose');

const musterSchema = new mongoose.Schema({
    code: Number,
    timeDefault: { type: Number, default: 600 },
    amount: { type: Number, default: 0 },
    win: { type: String },
    players: { type: Array },
    status: { type: String, default: 'active' }
}, { timestamps: true })

module.exports = mongoose.model('Muster', musterSchema);