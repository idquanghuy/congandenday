const moment = require('moment');
const momoService = require('../services/momo.service');
const historyService = require('../services/history.service');
const gameService = require('../services/game.service');
const momoHelper = require('../helpers/momo.helper');
const historyHelper = require('../helpers/history.helper');
const rewardModel = require('../models/reward.model');
const gameModel = require('../models/game.model');
const historyModel = require('../models/history.model');
const momoModel = require('../models/momo.model');

const apiController = {

    // API SYSTEM CONTROLLER

    getGame: async (req, res, next) => {
        try {
            let data = await gameService.getGame();
            res.json({
                success: true,
                message: 'Lấy thành công!',
                data
            })
        } catch (err) {
            console.log(err);
            next(err);
        }
    },
    getPhone: async (req, res, next) => {
        try {
            let data = await momoService.getPhone({ status: 'active', loginStatus: 'active' }, res.locals.settings.limitPhone, res.locals.settings.history.dataType);
            res.json({
                success: true,
                message: 'Lấy thành công!',
                data
            })
        } catch (err) {
            console.log(err);
            next(err);
        }
    },
    getReward: async (req, res, next) => {
        try {
            if (!req.body.gameType) {
                return res.json({
                    success: false,
                    message: 'Trường gameType không được bỏ trống!'
                })
            }

            let data = await rewardModel.find({ gameType: req.body.gameType }, { _id: 0, __v: 0, resultType: 0 });

            if (!await gameModel.findOne({ gameType: req.body.gameType, display: 'show' })) {
                res.json({
                    success: false,
                    message: 'Game này không tồn tại hoặc không hợp lệ!'
                })
            } else {
                res.json({
                    success: true,
                    message: 'Lấy thành công!',
                    data
                })
            }

        } catch (err) {
            console.log(err);
            next(err);
        }
    },
    getHistory: async (req, res, next) => {
        try {
            let data = await historyService.getHistory();

            res.json({
                success: true,
                message: 'Lấy thành công!',
                data
            })
        } catch (err) {
            next(err);
        }
    },
    getCount: async (req, res, next) => {
        try {
            if (!req.body.phone) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập số điện thoại!',
                })
            }

            if (res.locals.settings.missionData.status != 'active') {
                return res.json({
                    success: false,
                    message: 'Nhiệm vụ ngày đang bảo trì!',
                })
            }

            let phone = req.body.phone;
            let dataDay = await historyModel.aggregate([{ $match: { partnerId: phone, timeTLS: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() } } }, { $group: { _id: null, amount: { $sum: '$money' } } }]);

            !dataDay.length ? res.json({
                success: false,
                message: 'Hôm nay bạn chưa chơi mini game trên hệ thống!'
            }) : res.json({
                success: true,
                message: 'Lấy thành công!',
                count: dataDay[0].amount
            })
        } catch (err) {
            next(err);
        }
    },
    checkTransId: async (req, res, next) => {
        try {
            let { phone, transId } = req.body;

            if (!transId) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập mã giao dịch!'
                })
            }

            if (transId.length < 8) {
                return res.json({
                    success: false,
                    message: 'Mã giao dịch không hợp lệ!'
                })
            }

            let find = await historyHelper.checkTransId(transId);
            if (!find && phone) {
                let check = await momoModel.findOne({ phone });
                if (!check) return res.json({
                    success: false,
                    message: 'Số này không tồn tại trên hệ thống!',
                })

                if (check.status == 'active' && check.loginStatus == 'active') return res.json({
                    success: false,
                    message: 'Số này vẫn còn hoạt động, vui lòng đợi!',
                })

                if (check.loginStatus != 'active') return res.json({
                    success: false,
                    message: 'Số này đang lỗi, hãy đợi admin xử lý!',
                })

                find = await historyHelper.checkTransId(transId, phone);
            }

            return !find ? res.json({
                success: false,
                message: 'Không tìm thấy mã giao dịch này!',
                data: []
            }) : res.json({
                success: true,
                message: 'Lấy thành công!',
                data: find
            })

        } catch (err) {
            next(err);
        }
    },
    refundTransId: async (req, res, next) => {
        try {
            let transId = req.body.transId;
            if (!transId) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập mã giao dịch!'
                })
            }

            if (transId.length < 8) {
                return res.json({
                    success: false,
                    message: 'Mã giao dịch không hợp lệ!'
                })
            }

            let find = await historyHelper.checkTransId(transId);

            if (!find) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy mã giao dịch này!'
                })
            }

            if (find.status == 'error' || find.status == 'wait' || find.status == 'done') {
                return res.json({
                    success: false,
                    message: find.status == 'error' ? 'Mã giao dịch này xử lý lỗi, vui lòng báo admin!' : (find.status == 'done' ? 'Mã giao dịch đã xử lý!' : 'Mã giao dịch này đang xử lý!')
                })
            }

            if (req.session.transId == transId) {
                return res.json({
                    success: false,
                    message: 'Mã giao dịch này đang xử lý, thử lại sau ít phút!!'
                })
            }

            req.session.transId = transId;
            historyHelper.rewardTransId(null, transId);
            setTimeout(() => req.session.destroy(), 120 * 1000);

            return res.json({
                success: true,
                message: 'Gửi yêu cầu hoàn tiền thành công!'
            })
        } catch (err) {
            req.session.transId = null;
            next(err);
        }
    },

    // MOMO CONTROLLER
    otp: async (req, res, next) => {
        try {
            let { phone, password } = req.body;
            if (!phone || !password) {
                return res.json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin!'
                })
            }

            res.json(await momoHelper.sendOTP(phone, password));

        } catch (err) {
            next(err);
        }
    },
    confirm: async (req, res, next) => {
        try {
            let { phone, otp } = req.body;
            if (!phone || !otp) {
                return res.json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin!'
                })
            }

            res.json(await momoHelper.confirmOTP(phone, otp));
        } catch (err) {
            next(err);
        }
    },
    login: async (req, res, next) => {
        try {
            let phone = req.body.phone;
            if (!phone) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập số điện thoại!'
                })
            }

            res.json(await momoHelper.login(phone));
        } catch (err) {
            next(err);
        }
    },
    balance: async (req, res, next) => {
        try {
            let phone = req.body.phone;
            if (!phone) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập số điện thoại!'
                })
            }

            res.json(await momoHelper.getBalance(phone));
        } catch (err) {
            next(err);
        }
    },
    history: async (req, res, next) => {
        try {
            let { phone, limit } = req.body;
            if (!phone) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập số điện thoại!'
                })
            }

            let configHistory = res.locals.settings.history;
            if (limit) configHistory.limit = limit;

            res.json(await momoHelper.getHistory(phone, configHistory));
        } catch (err) {
            next(err);
        }
    },
    details: async (req, res, next) => {
        try {
            let { phone, transId } = req.body;
            if (!phone || !transId) {
                return res.json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin!'
                })
            }

            res.json(await momoHelper.getDetails(phone, transId));
        } catch (err) {
            next(err);
        }
    },
    transfer: async (req, res, next) => {
        try {
            let { phone, receiver, amount, comment } = req.body;
            if (!phone || !receiver || !amount) {
                return res.json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin!'
                })
            }

            res.json(await momoHelper.moneyTransfer(phone, { phone: receiver, amount, comment }));
        } catch (err) {
            next(err);
        }
    }
}

module.exports = apiController;