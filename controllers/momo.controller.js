const moment = require('moment');
const historyModel = require('../models/history.model');
const momoModel = require('../models/momo.model');
const historyService = require('../services/history.service');
const momoService = require('../services/momo.service');
const momoHelper = require('../helpers/momo.helper');
const pusherHelper = require('../helpers/pusher.helper');

const momoController = {
    index: async (req, res, next) => {
        try {
            let list = [];
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
                        name: { $regex: search }
                    }
                ]

                if (!isNaN(search)) {
                    filters.$or.push(...[
                        { money: search },
                        { betMax: search },
                        { betMin: search },
                        { count: search },
                        { limitDay: search },
                        { limitMonth: search }
                    ])
                }

                res.locals.search = search;
            }

            let pageCount = await momoModel.countDocuments(filters);
            let pages = Math.ceil(pageCount / perPage);

            if (req.query?.page) {
                req.query.page > pages ? page = pages : page = req.query.page;
            }

            let count = await momoModel.aggregate([{ $group: { _id: null, amount: { $sum: '$money' } } }]);
            let listMomo = await momoModel.find(filters).skip((perPage * page) - perPage).sort({ updatedAt: 'desc' }).limit(perPage).lean();

            for (let dataMomo of listMomo) {
                let { amountDay, amountMonth } = await historyService.moneyCount(dataMomo.phone, res.locals.settings.history.dataType);
                let [receiptDay, receiptMonth] = await Promise.all([historyModel.aggregate([{ $match: { phone: dataMomo.phone, io: 1, timeTLS: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() } } }, { $group: { _id: null, amount: { $sum: '$money' } } }]), historyModel.aggregate([{ $match: { phone: dataMomo.phone, io: 1, timeTLS: { $gte: moment().startOf('month').toDate(), $lt: moment().endOf('month').toDate() } } }, { $group: { _id: null, amount: { $sum: '$money' } } }])]);

                list.push({
                    ...dataMomo,
                    amountDay,
                    amountMonth,
                    receiptDay: !receiptDay.length ? 0 : receiptDay[0].amount,
                    receiptMonth: !receiptMonth.length ? 0 : receiptMonth[0].amount
                })
            }

            res.render('admin/momo', {
                title: 'Danh Sách Tài Khoản', list, perPage, count: !count.length ? 0 : count[0].amount, pagination: {
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
    info: async (req, res, next) => {
        try {
            let phone = req.params.id;

            let data = await momoModel.findOne({ phone });
            if (!data) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy #' + phone
                })
            }

            res.json({
                success: true,
                message: 'Lấy thành công!',
                data
            })
        } catch (err) {
            next(err);
        }
    },
    update: async (req, res, next) => {
        try {
            let id = req.params.id;
            if (!await momoModel.findByIdAndUpdate(id, { $set: { ...req.body } })) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy số điện thoại này!'
                })
            }

            if (req.body?.status || req.body?.loginStatus || req.body?.bonus) {
                pusherHelper.trigger('phoneData', await momoService.getPhone({ status: 'active', loginStatus: 'active' }, res.locals.settings.limitPhone, res.locals.settings.history.dataType));
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

            let data = await momoModel.findByIdAndDelete(id);
            if (!data) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy #' + id
                })
            }

            if (data._doc.status == 'active' && data._doc.loginStatus == 'active') {
                pusherHelper.trigger('phoneData', await momoService.getPhone({ status: 'active', loginStatus: 'active' }, res.locals.settings.limitPhone, res.locals.settings.history.dataType));
            }

            res.json({
                success: true,
                message: 'Xóa thành công #' + id
            })
        } catch (err) {
            next(err);
        }
    },
    updateMoney: async (req, res, next) => {
        try {
            let id = req.params.id;

            let data = await momoModel.findOne({ id });

            if (!data) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy #' + id
                })
            }

            let getBalance = await momoHelper.getBalance(data.phone);
            if (!getBalance.success) return getBalance;

            res.json({
                success: true,
                message: 'Cập nhập số dư thành công!',
                balance: getBalance.balance,
            })
        } catch (err) {
            next(err);
        }
    },
    updateToken: async (req, res, next) => {
        try {
            let id = req.params.id;

            let data = await momoModel.findOne({ id });

            if (!data) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy #' + id
                })
            }

            let refreshToken = await momoHelper.refreshToken(data.phone);
            if (!refreshToken.success) return refreshToken;

            res.json({
                success: true,
                message: 'Cập nhập token mới thành công!',
            })
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
                    message: 'Vui lòng nhập đầy đủ thông tin!'
                });
            }

            if (amount < 100) {
                return res.json({
                    success: false,
                    message: 'Số tiền chuyển cần lớn hơn 100đ'
                })
            }

            let data = await momoModel.findOne({ phone, loginStatus: 'active' });

            if (!data) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy số này hoặc số này đang lỗi!'
                })
            }

            let transfer = await momoHelper.moneyTransfer(phone, { phone: receiver, amount, comment });

            if (!transfer.success) {
                return res.json(transfer);
            }

            pusherHelper.trigger('phoneData', await momoService.getPhone({ status: 'active', loginStatus: 'active' }, res.locals.settings.limitPhone, res.locals.settings.history.dataType));

            res.json({
                success: true,
                message: 'Chuyển tiền thành công #' + transfer.data.transId
            })
        } catch (err) {
            next(err);
        }
    }

}

module.exports = momoController;