const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    username: String,
    password: String,
    token: String,
    ip: String
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema);