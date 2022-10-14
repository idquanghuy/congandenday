const fs = require('fs');
const moment = require('moment');
const historyModel = require('../models/history.model')
const blockModel = require('../models/block.model')

const playerController = {
    player: async (req, res, next) => {
        try {
            let filters = [
                { $match: { io: 1, gameType: { $exists: true, $ne: null } } },
                { $group: { _id: "$partnerId", amount: { $sum: '$money' }, bonus: { $sum: '$bonus' } } },
                { $sort: { amount: -1 } },
            ];
            let phone, startTime, endTime;
            let perPage = 16;
            let page = req.query.page || 1;

            if (req.query?.perPage) {
                perPage = req.query.perPage;
                res.locals.perPage = perPage;
            }

            if (req.query?.startTime) {
                startTime = moment(req.query.startTime).startOf('day').toDate();
                res.locals.startTime = moment(startTime).format('YYYY-MM-DD');
            }

            if (req.query?.endTime) {
                endTime = moment(req.query.endTime).endOf('day').toDate();
                res.locals.endTime = moment(endTime).format('YYYY-MM-DD');
            }

            if (req.query?.dateTime) {
                startTime = moment(req.query.dateTime).startOf('day').toDate();
                endTime = moment(req.query.dateTime).endOf('day').toDate();
                res.locals.dateTime = moment(req.query.dateTime).format('YYYY-MM-DD');
            }

            if (req.query?.phone) {
                if (/(((\+|)84)|0)(3|5|7|8|9)+([0-9]{8})\b/.test(req.query.phone)) {
                    phone = req.query.phone;
                    filters[0].$match.partnerId = phone;
                    filters[1].$group._id = null;
                    res.locals.phone = phone;
                }
            }

            if (startTime && endTime) {
                filters[0].$match.timeTLS = { $gte: startTime, $lt: endTime };
                filters[0].$match.timeTLS = { $gte: startTime, $lt: endTime };
            }

            let pageCount = (await historyModel.aggregate(filters)).length;
            let pages = Math.ceil(pageCount / perPage);

            if (req.query?.page) {
                req.query.page > pages ? page = pages : page = req.query.page;
            }

            filters.push({ $skip: (perPage * page) - perPage }, { $limit: Number(perPage) });

            let players = await historyModel.aggregate(filters);
            if (phone) players.map((item) => item._id = phone);

            res.render('admin/player', {
                title: 'Danh Sách Người Chơi', players, pagination: {
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
    block: async (req, res, next) => {
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
                    }
                ];

                if (search.toLowerCase().includes('đã chặn') || search == 'active' || search.toLowerCase().includes('tạm dừng') || search == 'pending') {
                    let status = (search.toLowerCase().includes('đã chặn') || search == 'active') ? 'active' : 'pending';
                    filters.$or.push({
                        status
                    })
                }

                res.locals.search = search;
            }

            let count = await historyModel.aggregate([{ $match: { status: 'phoneBlock' } }, { $group: { _id: null, amount: { $sum: '$money' } } }]);
            let pageCount = await blockModel.countDocuments(filters);
            let pages = Math.ceil(pageCount / perPage);

            if (req.query?.page) {
                req.query.page > pages ? page = pages : page = req.query.page;
            }

            let blocks = await blockModel.find(filters).skip((perPage * page) - perPage).sort({ updatedAt: 'desc' }).limit(perPage).lean();

            for (let block of blocks) {
                let data = await historyModel.aggregate([{ $match: { partnerId: block.phone, status: 'phoneBlock' } }, { $group: { _id: null, amount: { $sum: '$money' } } }]);
                let amount = data.length ? data[0].amount : 0;

                list.push({
                    ...block,
                    amount
                })
            }

            res.render('admin/block', {
                title: 'Danh Sách Đen', count: count.length ? count[0].amount : 0, list, perPage, pagination: {
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
    addBlock: async (req, res, next) => {
        try {
            let phone = req.body.phone;

            if (!phone) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập số điện thoại!'
                })
            }

            if (await blockModel.findOne({ phone })) {
                return res.json({
                    success: false,
                    message: 'Bạn đã chặn số này rồi!'
                })
            }

            let blockNew = await new blockModel({ phone }).save();

            res.json({
                success: true,
                message: 'Thêm thành công!',
                data: blockNew
            })
        } catch (err) {
            next(err);
        }
    },
    updateBlock: async (req, res, next) => {
        try {
            let id = req.params.id;
            let status = req.body.status;

            if (!status) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập đầy đủ thông tin!'
                })
            }

            let data = await blockModel.findByIdAndUpdate(id, { $set: { status } });

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
    removeBlock: async (req, res, next) => {
        try {
            let id = req.params.id;
            let data = await blockModel.findByIdAndDelete(id);

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
    all: async (req, res, next) => {
        try {
            let players = await historyModel.aggregate([
                { $match: { io: 1, gameType: { $exists: true, $ne: null } } },
                { $group: { _id: "$partnerId" } }
            ]);

            let newFile = fs.writeFileSync('./data.txt', players.map((item) => item._id) + "\n");

            res.download('./data.txt');
        } catch (err) {
            next(err);
        }
    }

}

module.exports = playerController;