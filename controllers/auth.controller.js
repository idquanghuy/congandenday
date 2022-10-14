const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken')
const userModel = require('../models/user.model');
const { v4: uuidv4 } = require("uuid");

const authController = {
    register: async (req, res, next) => {
        try {
            let { name, username, password, TOKEN_SETUP } = req.body;
            if (!name || !username || !password) {
                return res.json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin!'
                })
            }

            if (process.env.TOKEN_SETUP != TOKEN_SETUP) {
                return res.json({
                    success: false,
                    message: 'Invaild Token Setup!'
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
            console.log(err);
            next(err);
        }
    },
    login: async (req, res, next) => {
        try {
            let { username, password } = req.body;
            if (!username || !password) {
                return res.json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin!'
                })
            }

            const user = await userModel.findOne({ username });
            if (!user) {
                return res.json({
                    success: false,
                    message: 'Sai thông tin đăng nhập'
                })
            }

            if (!await bcrypt.compare(password, user.password)) {
                return res.json({
                    success: false,
                    message: 'Sai thông tin đăng nhập'
                })
            }

            const token = JWT.sign({ _id: user._id, name: user.name, username: user.username, token: user.token }, process.env.JWT_SECRET, {
                expiresIn: '7d'
            });
            await userModel.findOneAndUpdate({ username }, { $set: { ip: req.ip } })

            res.cookie('Authorization', token, {
                httpOnly: true,
                maxAge: 168 * 60 * 60 * 1000 // 7 days
            }).json({
                success: true,
                message: 'Đăng nhập thành công!'
            })

        } catch (err) {
            console.log(err);
            next(err);
        }
    },
    logout: async (req, res) => res.clearCookie('Authorization') && res.redirect('../adminPanel')
}

module.exports = authController;