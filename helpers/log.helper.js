"use strict";
const moment = require("moment");
const logModel = require('../models/log.model');
const pusherHelper = require('../helpers/pusher.helper');
const telegramHelper = require('../helpers/telegram.helper');

module.exports = {
    create: async (typeData, content, telegram = true) => {
        if (process.env.TELEGRAM_TOKEN && process.env.TELEGRAM_CHATID && telegram) {
            await telegramHelper.sendText(process.env.TELEGRAM_TOKEN, process.env.TELEGRAM_CHATID, `${typeData} | ${content}`);
        }

        const logContent = await new logModel({ typeData, content }).save();
        pusherHelper.trigger('logSystem', { ...logContent._doc })
        return logContent;
    }
}