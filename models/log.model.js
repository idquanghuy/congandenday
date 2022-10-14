const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    content: String,
    typeData: String,
    time: {type: Date, default: Date.now},
})

module.exports = mongoose.model('log', logSchema);