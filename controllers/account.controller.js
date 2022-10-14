const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require("uuid");
const userModel = require('../models/user.model');

const accountController = {
    index: async (req, res, next) => {
        try {
            let filters = {};
            let perPage = 16;
            let page = req.query.page || 1;

            if (req.query?.perPage) {
                perPage = req.query.perPage;
            }

            if (req.query?.search) {
                filters.$or = [
                    {
                        name: { $regex: req.query.search }
                    },
                    {
                        username: { $regex: req.query.search }
                    },
                    {
                        token: { $regex: req.query.search }
                    },
                    {
                        ip: { $regex: req.query.search }
                    }
                ];
                res.locals.search = req.query.search;
            }

            let pageCount = await userModel.countDocuments(filters);
            let pages = Math.ceil(pageCount / perPage);

            if (req.query?.page) {
                req.query.page > pages ? page = pages : page = req.query.page;
            }

            let users = await userModel.find(filters).skip((perPage * page) - perPage).sort({ updatedAt: 'desc' }).limit(perPage).lean();
            res.render('admin/account', {
                title: 'Danh Sách Tài Khoản', users, perPage, pagination: {
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
            let { name, username, password } = req.body;

            if (!name || !username || !password) {
                return res.json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin!'
                })
            }

            let check = await userModel.findOne({ username });

            if (check) {
                return res.json({
                    success: false,
                    message: 'Tên đăng nhập đã tồn tại!'
                })
            }

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);

            const data = await new userModel({
                name,
                username,
                password: hash,
                ip: req.socket.remoteAddress,
                token: uuidv4().toUpperCase()
            }).save();

            res.json({
                success: true,
                message: 'Tạo tài khoản thành công!',
                data
            })
        } catch (err) {
            next(err);
        }
    },
    update: async (req, res, next) => {
        try {
            let id = req.params.id;
            if (!await userModel.findByIdAndUpdate(id, { $set: { ...req.body } })) {
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

            if (!await userModel.findByIdAndDelete(id)) {
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

module.exports = accountController;