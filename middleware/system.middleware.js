"use strict";

exports.isInstalled = async (req, res, next) => res.locals.settings ? res.redirect('../') : next();

exports.notInstalled = async (req, res, next) => !res.locals.settings ? res.redirect('../install') : next();

exports.isActive = async (req, res, next) => (res.locals.settings && res.locals.settings.siteStatus == 'active') ? next() : res.json({ success: false, message: 'Hệ thống đang tạm bảo trì!' })