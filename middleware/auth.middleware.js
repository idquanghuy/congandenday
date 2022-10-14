"use strict"
const JWT = require('jsonwebtoken');
const userModel = require('../models/user.model');

exports.loggedIn = async (req, res, next) => {
    try {
        if (!req.cookies?.['Authorization']) return res.redirect('../adminPanel/login');

        let token = req.cookies['Authorization'];
        let user = JWT.verify(token, process.env.JWT_SECRET);
        if (!await userModel.findOne({ _id: user._id })) throw new Error(`User ${user._id} not found`);

        res.locals.profile = user;
        return next();
    } catch (err) {
        console.log(err);
        res.clearCookie('Authorization');
        return res.redirect('../adminPanel/login');
    }
}

exports.isAuth = async (req, res, next) => {
    try {
        if (!req.cookies?.['Authorization']) return next();

        let token = req.cookies['Authorization'];
        let user = JWT.verify(token, process.env.JWT_SECRET);
        if (!await userModel.findOne({ _id: user._id })) throw new Error(`User ${user._id} not found`);

        res.locals.profile = user;
        res.redirect('../adminPanel/dashboard');
    } catch (err) {
        console.log(err);
        res.clearCookie('Authorization');
        return next();
    }
}

exports.isAdmin = async (req, res, next) => {
    try {
        if (!req.cookies?.['Authorization'] && (!req.headers.token || !await userModel.findOne({ token: req.headers.token }))) return res.json({ success: false, message: 'Không có quyền truy cập!' })
        if ((req.headers.token && await userModel.findOne({ token: req.headers.token }))) return next();

        let token = req.cookies['Authorization'];
        let user = JWT.verify(token, process.env.JWT_SECRET);
        if (!await userModel.findOne({ _id: user._id })) throw new Error(`User ${user._id} not found`);

        return next();
    } catch (err) {
        console.log(err);
        res.clearCookie('Authorization');
        return res.json({ success: false, message: 'Không có quyền truy cập!' })
    }
}
