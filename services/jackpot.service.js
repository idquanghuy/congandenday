const jackpotModel = require('../models/jackpot.model');
const settingModel = require('../models/setting.model');
const historyJackpot = require('../models/history-jackpot.model');
const jackpotHelper = require('../helpers/jackpot.helper');
const pusherHelper = require('../helpers/pusher.helper');
const moment = require('moment');

const jackpotService = {
    joinJackpot: async (phone, ip) => {
        try {
            let player = await jackpotModel.findOne({ phone });

            if (player && player.isJoin == 1) {
                return ({
                    success: false,
                    message: 'Số điện thoại này đã tham gia nổ hũ!'
                })
            }

            if (!player) {
                await new jackpotModel({ phone, ip }).save();
                return ({
                    success: true,
                    message: 'Tham gia thành công!'
                })
            }

            await jackpotModel.findOneAndUpdate({ phone }, { $set: { isJoin: 1 } });
            return ({
                success: true,
                message: 'Tham gia thành công!'
            })

        } catch (err) {
            return ({
                success: false,
                message: 'Có lỗi xảy ra ' + err
            })
        }
    },
    outJackpot: async (phone) => {
        try {
            let player = await jackpotModel.findOne({ phone });

            if (!player || player.isJoin != 1) {
                return ({
                    success: false,
                    message: 'Số điện thoại này chưa tham gia nổ hũ!'
                })
            }

            await jackpotModel.findOneAndUpdate({ phone }, { $set: { isJoin: -1 } })
            return ({
                success: true,
                message: 'Hủy tham gia thành công!'
            })

        } catch (err) {
            return ({
                success: false,
                message: 'Có lỗi xảy ra ' + err
            })
        }
    },
    checkJoin: async (phone) => {
        let player = await jackpotModel.findOne({ phone });

        return !player ? ({
            isJoin: 0
        }) : ({
            isJoin: player.isJoin,
            time: moment(player.createdAt).format('YYYY-MM-DD HH:mm:ss')
        })
    },
    getHistory: async (limit = 5) => {
        let list = [];
        let history = await historyJackpot.find({ status: 'success' }).sort({ createdAt: 'desc' }).limit(limit);
        
        for (let data of history) {
            list.push({
                phone: data.receiver,
                amount: data.amount,
                time: moment(data.createdAt).format('YYYY-MM-DD HH:mm:ss')
            })
        }

        return list;
    },
    updateJackpot: async (phone, amount) => {
        try {
            let check = await jackpotService.checkJoin(phone);

            if (check.isJoin == 1) {
                await settingModel.findOneAndUpdate({}, { $inc: { jackpotCount: parseInt(amount) } });
                await jackpotModel.findOneAndUpdate({ phone }, { $inc: { amount } });
                pusherHelper.trigger('jackpotCount', await jackpotHelper.jackpotCount());
            }

            return;
        } catch (err) {
            console.log(err);
            return;
        }
    }
}

module.exports = jackpotService;