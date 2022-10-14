const jackpotModel = require('../models/jackpot.model');
const momoModel = require('../models/momo.model');
const historyJackpot = require('../models/history-jackpot.model');
const jackpotHelper = require('../helpers/jackpot.helper');

const jackpotController = {
    player: async (req, res, next) => {
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
                        ip: { $regex: search }
                    }
                ]

                if (search.toLowerCase().includes('đã tham gia') || search == 1 || search.toLowerCase().includes('đã hủy') || search == 0) {
                    let isJoin = (search.toLowerCase().includes('đã tham gia') || search == 1) ? 1 : 0;
                    filters.$or.push({
                        isJoin
                    })
                }

                res.locals.search = search;
            }

            let pageCount = await jackpotModel.countDocuments(filters);
            let pages = Math.ceil(pageCount / perPage);

            if (req.query?.page) {
                req.query.page > pages ? page = pages : page = req.query.page;
            }

            let jackpots = await jackpotModel.find(filters).skip((perPage * page) - perPage).sort({ updatedAt: 'desc' }).limit(perPage).lean();

            res.render('admin/jackpot', {
                title: 'Danh Sách Chơi Nổ Hũ', jackpots, perPage, pagination: {
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
    updatePlayer: async (req, res, next) => {
        try {
            let id = req.params.id;
            let isJoin = req.body.isJoin;

            if (!isJoin) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập đầy đủ thông tin!'
                })
            }

            let data = await jackpotModel.findByIdAndUpdate(id, { $set: { isJoin } });

            if (!data) {
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
    removePlayer: async (req, res, next) => {
        try {
            let id = req.params.id;
            let data = await jackpotModel.findByIdAndDelete(id);

            if (!data) {
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
    history: async (req, res, next) => {
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
                        receiver: { $regex: search }
                    },
                    {
                        transId: { $regex: search }
                    }
                ]

                if (search.toLowerCase().includes('đã xử lý') || search == 'success' || search.toLowerCase().includes('đang xử lý') || search == 'wait' || search.toLowerCase().includes('lỗi') || search == 'error') {
                    let status = (search.toLowerCase().includes('đã xử lý') || search == 'success') ? 'success' : ((search.toLowerCase().includes('đang xử lý') || search == 'wait') ? 'wait' : 'error');
                    filters.$or.push({
                        status
                    })
                }

                res.locals.search = search;
            }

            let pageCount = await historyJackpot.countDocuments(filters);
            let pages = Math.ceil(pageCount / perPage);

            if (req.query?.page) {
                req.query.page > pages ? page = pages : page = req.query.page;
            }

            let historys = await historyJackpot.find(filters).skip((perPage * page) - perPage).sort({ updatedAt: 'desc' }).limit(perPage).lean();
            let phones = await momoModel.find({ status: 'active', loginStatus: 'active' }).lean();
            res.render('admin/history-jackpot', {
                title: 'Lịch Sử Nổ Hũ', historys, phones, perPage, pagination: {
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
    updateHistory: async (req, res, next) => {
        try {
            let id = req.params.id;
            let status = req.body.status;

            if (!status) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập đầy đủ thông tin!'
                })
            }

            let data = await historyJackpot.findByIdAndUpdate(id, { $set: { status } });

            if (!data) {
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
    removeHistory: async (req, res, next) => {
        try {
            let id = req.params.id;

            if (id == 'all') {
                await historyJackpot.deleteMany();

                return res.json({
                    success: true,
                    message: 'Xóa tất cả thành công!'
                })
            }

            if (!await historyJackpot.findByIdAndDelete(id)) {
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

            let data = await historyJackpot.findOne({ transId });

            if (!data) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy dữ liệu!'
                })
            }

            if (data.status != 'wait') {
                return res.json({
                    success: false,
                    message: 'Chỉ trả thưởng nổ hũ ở trạng thái đang xử lý!'
                })
            }

            let reward = await jackpotHelper.rewardJackpot(phone, data.receiver, transId, data.amount);

            return !reward ? res.json({
                success: false,
                message: 'Trả thưởng nổ hũ thất bại!'
            }) : res.json({
                success: true,
                message: 'Trả thưởng thành công #' + reward.transId
            })

        } catch (err) {
            next(err);
        }
    }
}

module.exports = jackpotController;