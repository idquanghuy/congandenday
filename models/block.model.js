const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true },
    status: { type: String, default: 'active' }
}, { timestamps: true })

module.exports = mongoose.model('block', blockSchema);