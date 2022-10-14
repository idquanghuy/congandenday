const mongoose = require('mongoose');

const momoSchema = mongoose.Schema({
    name: String,
    phone: { type: String, required: true, unique: true },
    password: String,
    money: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    limitDay: { type: Number, default: 50000000 },
    limitMonth: { type: Number, default: 100000000 },
    count: { type: Number, default: 130 },
    betMin: { type: Number, default: 10000 },
    betMax: { type: Number, default: 500000 },
    rkey: String,
    imei: String,
    SECUREID: String,
    AAID: String,
    TOKEN: String,
    dataDevice: Object,
    setupKey: String,
    phash: String,
    description: String,
    AUTH_TOKEN: String,
    REFRESH_TOKEN: String,
    REQUEST_ENCRYPT_KEY: String,
    loginAt: Date,
    status: { type: String, default: 'active' },
    loginStatus: String
}, { timestamps: true })

module.exports = mongoose.model('Momo', momoSchema);