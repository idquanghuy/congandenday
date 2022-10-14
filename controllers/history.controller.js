const historyModel = require('../models/history.model');
const gameModel = require('../models/game.model');
const transferModel = require('../models/transfer.model');
const momoModel = require('../models/momo.model');
const historyHelper = require('../helpers/history.helper');

const historyController = {
    index: async (req, res, next) => {
        try {
            let filters = {};
            let perPage = 16;
            let page = req.query.page || 1;

            if (req.query?.perPage) {
                perPage = req.query.perPage;
            }

            if (req.query?.status) {
                let isStatus = ['wait', 'transfer', 'recharge', 'errorComment', 'limitRefund', 'limitBet', 'refund', 'waitReward', 'waitRefund', 'win', 'won', 'errorMoney', 'limitPhone', 'errorPhone', 'phoneBlock'];

                if (isStatus.includes(req.query.status)) {
                    filters.status = req.query.status;

                    res.locals.status = req.query.status;
                }

                if (req.query.status == 'error') {
                    let allError = ['errorComment', 'limitRefund', 'limitBet', 'errorMoney', 'limitPhone', 'errorPhone', 'phoneBlock'];

                    filters.$or = allError.map((item) => {
                        return { status: item };
                    });

                    res.locals.status = req.query.status;
                }
            }

            if (req.query?.io) {
                if (req.query.io == -1 || req.query.io == 1) {
                    filters.io = Number(req.query.io);

                    res.locals.io = req.query.io;
                }
            }

            if (req.query.gameType) {
                filters.gameType = req.query.gameType;

                res.locals.gameType = req.query.gameType;
            }

            if (req.query?.search) {
                let search = req.query.search;

                filters.$or ? filters.$or.push(...[
                    {
                        phone: { $regex: search }
                    },
                    {
                        comment: { $regex: search }
                    },
                    {
                        gameName: { $regex: search }
                    },
                    {
                        gameType: { $regex: search }
                    },
                    {
                        partnerId: { $regex: search }
                    },
                    {
                        targetId: { $regex: search }
                    },
                    {
                        targetName: { $regex: search }
                    }
                ]) : filters.$or = [
                    {
                        phone: { $regex: search }
                    },
                    {
                        comment: { $regex: search }
                    },
                    {
                        gameName: { $regex: search }
                    },
                    {
                        gameType: { $regex: search }
                    },
                    {
                        partnerId: { $regex: search }
                    },
                    {
                        targetId: { $regex: search }
                    },
                    {
                        targetName: { $regex: search }
                    }
                ];

                if (!isNaN(search)) {
                    filters.$or.push(...[
                        { transId: search },
                        { money: search },
                        { bonus: search },
                        { postBalance: search }
                    ])
                }

                res.locals.search = search;
            }

            let pageCount = await historyModel.countDocuments(filters);
            let pages = Math.ceil(pageCount / perPage);

            if (req.query?.page) {
                req.query.page > pages ? page = pages : page = req.query.page;
            }

            let games = await gameModel.find().lean();
            let list = await historyModel.find(filters).skip((perPage * page) - perPage).sort({ updatedAt: 'desc' }).limit(perPage).lean();
            let phones = await momoModel.find({ status: 'active', loginStatus: 'active' }).lean();

            res.render('admin/history', {
                title: 'Lịch Sử Giao Dịch', list, games, phones, perPage, pagination: {
                    page,
                    pageCount,
                    limit: pages > 5 ? 5 : pages,
                    query: res.locals.query,
                    baseURL: res.locals.originalUrl.pathname
                }
            })
        } catch (err) {
            next(err);
        }
    },
    update: async (req, res, next) => {
        try {
            let id = req.params.id;
            if (!await historyModel.findByIdAndUpdate(id, { $set: { ...req.body } })) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy #' + id
                })
            }

            res.json({
                success: true,
                message: 'Lưu thành công #' + id
            })
        } catch (err) {
            next(err);
        }
    },
    remove: async (req, res, next) => {
        try {
            let id = req.params.id;

            if (id == 'all') {
                await historyModel.deleteMany();

                return res.json({
                    success: true,
                    message: 'Xóa tất cả thành công!'
                })
            }

            if (!await historyModel.findByIdAndDelete(id)) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy #' + id
                })
            }

            res.json({
                success: true,
                message: 'Xóa thành công #' + id
            })
        } catch (err) {
            next(err);
        }
    },
    transfer: async (req, res, next) => {
        try {
            let filters = {};
            let perPage = 16;
            let page = req.query.page || 1;

            if (req.query?.perPage) {
                perPage = req.query.perPage;
            }

            if (req.query?.search) {
                let search = req.query.search;

                filters.$or = [
                    {
                        phone: { $regex: search }
                    },
                    {
                        receiver: { $regex: search }
                    },
                    {
                        comment: { $regex: search }
                    }
                ]

                if (!isNaN(search)) {
                    filters.$or.push(...[
                        { transId: search },
                        { firstMoney: search },
                        { amount: search },
                        { lastMoney: search }
                    ])
                }

                res.locals.search = search;
            }

            let pageCount = await transferModel.countDocuments(filters);
            let pages = Math.ceil(pageCount / perPage);

            if (req.query?.page) {
                req.query.page > pages ? page = pages : page = req.query.page;
            }

            let history = await transferModel.find(filters).skip((perPage * page) - perPage).sort({ updatedAt: 'desc' }).limit(perPage).lean();

            res.render('admin/history-transfer', {
                title: 'Lịch Sử Nổ Hũ', history, perPage, pagination: {
                    page,
                    pageCount,
                    limit: pages > 5 ? 5 : pages,
                    query: res.locals.query,
                    baseURL: res.locals.originalUrl.pathname
                }
            });
        } catch (err) {
            next(err);
        }
    },
    deleteTransfer: async (req, res, next) => {
        try {
            let id = req.params.id;

            if (id == 'all') {
                await transferModel.deleteMany();

                return res.json({
                    success: true,
                    message: 'Xóa tất cả thành công!'
                })
            }
            
            if (!await transferModel.findByIdAndDelete(id)) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy #' + id
                })
            }

            res.json({
                success: true,
                message: 'Xóa thành công #' + id
            })
        } catch (err) {
            next(err);
        }
    },
    rework: async (req, res, next) => {
        try {
            let { phone, transId } = req.body;

            if (!phone) {
                return res.json({
                    success: false,
                    message: 'Vui lòng chọn số điện thoại!'
                })
            }

            if (!transId) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập mã giao dịch!'
                })
            }

            if (!await momoModel.findOne({ phone, status: 'active', loginStatus: 'active' })) {
                return res.json({
                    success: false,
                    message: 'Số điện thoại này không hoạt động!'
                })
            }

            let data = await historyModel.findOne({ transId });

            if (!data) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy dữ liệu!'
                })
            }

            let reward = await historyHelper.rewardTransId(phone, transId);

            return !reward ? res.json({
                success: false,
                message: 'Trả thưởng lại thất bại!'
            }) : res.json({
                success: true,
                message: 'Trả thưởng lại thành công #' + reward.transId
            })

        } catch (err) {
            next(err);
        }
    }

}

module.exports = historyController;