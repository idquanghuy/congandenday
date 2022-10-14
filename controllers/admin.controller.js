const moment = require('moment');
const logModel = require('../models/log.model');
const settingModel = require('../models/setting.model');
const revenueService = require('../services/revenue.service');

const adminController = {
    dashboard: async (req, res, next) => {
        try {
            let _phone;
            let _revenueDay = moment().format('YYYY-MM-DD');
            let _revenueMonth = moment().format('YYYY-MM');

            if (req.query?._phone) {
                if (/(((\+|)84)|0)(3|5|7|8|9)+([0-9]{8})\b/.test(req.query._phone)) {
                    _phone = req.query._phone;
                }
            }

            if (req.query?._revenueDay) {
                let valueDay = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
                if (req.query._revenueDay.match(valueDay)) {
                    _revenueDay = moment(req.query._revenueDay).format('YYYY-MM-DD');
                }
            }

            if (req.query?._revenueMonth) {
                let valueDay = /^\d{4}-(0[1-9]|1[0-2])$/;
                if (req.query._revenueMonth.match(valueDay)) {
                    _revenueMonth = moment(req.query._revenueMonth).format('YYYY-MM');
                }
            }

            let logs = await logModel.find().sort({ time: 'desc' }).limit(30).lean();
            let [betDay, betMonth, betAll, moneyDay, moneyMonth] = await Promise.all([revenueService.revenueBet(_revenueDay, 'day', _phone), revenueService.revenueBet(_revenueMonth, 'month', _phone), revenueService.revenueBet(null, null, _phone), revenueService.revenueMoney(_revenueDay, 'day', _phone), revenueService.revenueMoney(_revenueMonth, 'month', _phone)]);
            let revenueData = {
                betDay,
                betMonth,
                betAll,
                moneyDay,
                moneyMonth
            }

            res.render('admin/dashboard', { title: 'Quản Trị Hệ Thống', revenueData, _revenueDay, _revenueMonth, logs: logs.reverse() })
        } catch (err) {
            next(err);
        }
    },
    system: async (req, res, next) => {
        try {
            let { nameSite, defaultTitle, description, keywords, headerScript, favicon, thumbnail, gameNote, limitPhone, paymentComment, withdrawComment, missionData, topData, history, refund, notification, jackpot, muster, siteStatus } = req.body;
            let data = await settingModel.findOneAndUpdate({}, { $set: { nameSite, defaultTitle, description, keywords, headerScript, favicon, thumbnail, gameNote, limitPhone, paymentComment, withdrawComment, missionData, topData, history, refund, notification, jackpot, muster, siteStatus } });

            res.json({
                success: true,
                message: 'Lưu thành công!',
                data
            })

        } catch (err) {
            next(err);
        }
    },
    logSystem: async (req, res, next) => {
        try {
            let id = req.params.id;
            id == 'all' ? await logModel.deleteMany() : await logModel.findByIdAndDelete(id);

            res.json({
                success: true,
                message: 'Xóa thành công!'
            })

        } catch (err) {
            next(err);
        }
    },
    revenueData: async (req, res, next) => {
        try {
            let _phone;
            let _revenueDay = moment().format('YYYY-MM-DD');
            let _revenueMonth = moment().format('YYYY-MM');

            if (req.query?._phone) {
                if (/(((\+|)84)|0)(3|5|7|8|9)+([0-9]{8})\b/.test(req.query._phone)) {
                    _phone = req.query._phone;
                }
            }

            if (req.query?._revenueDay) {
                let valueDay = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
                if (req.query._revenueDay.match(valueDay)) {
                    _revenueDay = moment(req.query._revenueDay).format('YYYY-MM-DD');
                }
            }

            if (req.query?._revenueMonth) {
                let valueDay = /^\d{4}-(0[1-9]|1[0-2])$/;
                if (req.query._revenueMonth.match(valueDay)) {
                    _revenueMonth = moment(req.query._revenueMonth).format('YYYY-MM');
                }
            }

            let [betDay, betMonth, betAll, moneyDay, moneyMonth] = await Promise.all([revenueService.revenueBet(_revenueDay, 'day', _phone), revenueService.revenueBet(_revenueMonth, 'month', _phone), revenueService.revenueBet(null, null, _phone), revenueService.revenueMoney(_revenueDay, 'day', _phone), revenueService.revenueMoney(_revenueMonth, 'month', _phone)]);
            let revenueData = {
                betDay,
                betMonth,
                betAll,
                moneyDay,
                moneyMonth
            }

            res.json({
                success: true,
                message: 'Lấy thành công!',
                data: revenueData
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = adminController;
