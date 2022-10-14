const musterModel = require('../models/muster.model');
const musterService = require('../services/muster.service');
const pusherHelper = require('../helpers/pusher.helper');

const musterController = {
    index: async (req, res, next) => {
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
                        win: { $regex: search }
                    },
                    {
                        players: { $regex: search }
                    }
                ]

                if (search.toLowerCase().includes('hoàn thành') || search == 'done' || search.toLowerCase().includes('đang quay') || search == 'active') {
                    let status = (search.toLowerCase().includes('hoàn thành') || search == 'done') ? 'done' : 'active';
                    filters.$or.push({
                        status
                    })
                }

                if (!isNaN(search)) {
                    filters.$or.push(...[
                        { code: search },
                        { timeDefault: search },
                        { amount: search }
                    ])
                }

                res.locals.search = search;
            }

            let pageCount = await musterModel.countDocuments(filters);
            let pages = Math.ceil(pageCount / perPage);

            if (req.query?.page) {
                req.query.page > pages ? page = pages : page = req.query.page;
            }

            let musters = await musterModel.find(filters).skip((perPage * page) - perPage).sort({ updatedAt: 'desc' }).limit(perPage).lean();

            res.render('admin/muster', {
                title: 'Danh Sách Chơi Nổ Hũ', musters, perPage, pagination: {
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
    update: async (req, res, next) => {
        try {
            let id = req.params.id;

            if (!await musterModel.findByIdAndUpdate(id, { $set: { ...req.body } })) {
                return res.json({
                    success: false,
                    message: 'Không tìm thấy #' + id
                })
            }

            if (req.body?.timeDefault) {
                pusherHelper.trigger('musterData', await musterService.info());
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
                await musterModel.deleteMany();

                return res.json({
                    success: true,
                    message: 'Xóa tất cả thành công!'
                })
            }

            let data = await musterModel.findByIdAndDelete(id);

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
    }
}

module.exports = musterController;