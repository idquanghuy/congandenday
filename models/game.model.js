const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    name: String,
    gameType: String,
    description: String,
    display: { type: String, default: 'show' },
}, { timestamps: true })

module.exports = mongoose.model('Game', gameSchema);