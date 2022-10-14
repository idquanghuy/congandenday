const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    nameSite: String,
    defaultTitle: String,
    description: String,
    keywords: String,
    favicon: String,
    thumbnail: String,
    headerScript: String,
    gameNote: String,
    limitPhone: {
        type: Number,
        default: 5
    },
    paymentComment: {
        type: String,
        default: '#naptien'
    },
    withdrawComment: {
        type: String,
        default: '#ruttien'
    },
    refund: {
        status: {
            type: String,
            default: 'active'
        },
        win: {
            type: Number,
            default: 100
        },
        won: {
            type: Number,
            default: 50
        },
        limit: {
            type: Number,
            default: 10
        }
    },
    missionData: {
        status: {
            type: String,
            default: 'active'
        },
        data: [
            {
                amount: Number,
                bonus: Number
            }
        ]
    },
    topData: {
        status: {
            type: String,
            default: 'active'
        },
        bonus: Array,
        fakeData: [
            {
                phone: String,
                amount: Number,
                bonus: Number
            }
        ]
    },
    history: {
        autoStatus: {
            type: String,
            default: 'active'
        },
        dataType: {
            type: String,
            default: 'history'
        },
        limit: {
            type: Number,
            default: 10
        },
        time: {
            type: Number,
            default: 30
        }
    },
    notification: {
        status: {
            type: String,
            default: 'close'
        },
        data: String
    },
    jackpot: {
        status: {
            type: String,
            default: 'close'
        },
        numberTLS: {
            type: Array,
            default: [
                111,
                222,
                333,
                444,
                555,
                666,
                777,
                888,
                999
            ]
        },
        amount: {
            type: Number,
            default: 10000
        }
    },
    muster: {
        min: {
            type: Number,
            default: 5000
        },
        max: {
            type: Number,
            default: 100000
        },
        delay: {
            type: Number,
            default: 600
        },
        limit: {
            type: Number,
            default: 10
        },
        startTime: {
            type: Number,
            default: 7
        },
        endTime: {
            type: Number,
            default: 23
        },
        noti: {
            type: String,
            default: `- Mỗi phiên quà các bạn có 10 phút để điểm danh. <br>
        - Số điện thoại điểm danh phải chơi mini game trên hệ thống ít nhất 1 lần trong ngày. Không giới hạn số lần điểm
        danh trong ngày. <br>
        - Khi hết thời gian, người may mắn sẽ nhận được số tiền của phiên đó. <br>
        - Game <b>Điểm danh miễn phí</b> chỉ hoạt động từ <b>7h - 24h</b>`
        },
        status: {
            type: String,
            default: 'active'
        }
    },
    jackpotCount: {
        type: Number,
        default: 0
    },
    siteStatus: {
        type: String,
        default: 'active'
    }
}, { timestamps: true })

module.exports = mongoose.model('Setting', settingSchema);