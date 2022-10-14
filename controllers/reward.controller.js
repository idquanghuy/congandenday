const gameModel = require('../models/game.model');
const rewardModel = require('../models/reward.model');
const pusherHelper = require('../helpers/pusher.helper');

const rewardController = {
    index: async (req, res, next) => {
        try {
            let games = await gameModel.find().lean();
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
                        content: { $regex: search }
                    },
                    {
                        gameType: { $regex: search }
                    },
                    {
                        numberTLS: { $regex: search }
                    }
                ];

                if (!isNaN(search)) {
                    filters.$or.push({
                        amount: search
                    })
                }
                
                if (search.toLowerCase().includes('hiệu ') || search.toLowerCase().includes('tổng ') || search.toLowerCase() == 'số cuối' || search.includes('count_') || search.includes('minus_') || search == 'end') {
                    let valueTLS = (search.includes('minus_') || search.includes('count_') || search.includes('end')) ? search : (search.toLowerCase().includes('tổng') ? 'count_' + search.replace(/[^\d]/g, '') : (search.toLowerCase().includes('hiệu') ? 'minus_' + search.replace(/[^\d]/g, '') : 'end'));

                    filters.$or.push({
                        resultType: valueTLS
                    })
                }

                res.locals.search = search;
            }

            let pageCount = await rewardModel.countDocuments(filters);
            let pages = Math.ceil(pageCount / perPage);

            if (req.query?.page) {
                req.query.page > pages ? page = pages : page = req.query.page;
            }

            let rewards = await rewardModel.find(filters).skip((perPage * page) - perPage).sort({ updatedAt: 'desc' }).limit(perPage).lean();
            res.render('admin/reward', {
                title: 'Quản Lý Trả Thưởng', games, rewards, perPage, pagination: {
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
    add: async (req, res, next) => {
        try {
            let { gameType, content, numberTLS, amount, resultType } = req.body;

            if (!content || !gameType || !numberTLS || !amount || !resultType) {
                return res.json({
                    success: false,
                    message: 'Vui lòng nhập đầy đủ thông tin!'
                })
            }

            if (!await gameModel.findOne({ gameType })) {
                return res.json({
                    success: false,
                    message: 'Loại game này không tồn tại!'
                })
            }

            let newReward = await new rewardModel({
                content,
                gameType,
                numberTLS,
                amount,
                resultType
            }).save();
            
            pusherHelper.trigger('rewardData', gameType);
            res.json({
                success: true,
                message: 'Thêm thành công!',
                data: newReward
            })
        } catch (err) {
            next(err);
        }
    },
    update: async (req, res, next) => {
        try {
            let id = req.params.id;
            let { gameType } = req.body;

            if (gameType && !await gameModel.findOne({ gameType })) {
                return res.json({
                    success: false,
                    message: 'Loại game này không tồn tại!'
                })
            }

            let data = await rewardModel.findByIdAndUpdate(id, { $set: { ...req.body } });
            if (!data) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy #' + id
                })
            }

            if (gameType) pusherHelper.trigger('rewardData', gameType)

            pusherHelper.trigger('rewardData', data.gameType);
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

            let data = await rewardModel.findByIdAndDelete(id);
            if (!data) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy #' + id
                })
            }

            pusherHelper.trigger('rewardData', data.gameType);
            res.json({
                success: true,
                message: 'Xóa thành công #' + id
            })
        } catch (err) {
            next(err);
        }
    }
}

module.exports = rewardController;