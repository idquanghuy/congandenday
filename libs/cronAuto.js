const cron = require('node-cron');
const moment = require('moment');
const sleep = require('time-sleep');
const settingModel = require('../models/setting.model');
const momoModel = require('../models/momo.model');
const musterModel = require('../models/muster.model');
const momoService = require('../services/momo.service');
const musterService = require('../services/muster.service');
const pusherHelper = require('../helpers/pusher.helper');
const historyHelper = require('../helpers/history.helper');

exports.runCron = async () => {
    try {
        let dataSetting = await settingModel.findOne();

        if (!dataSetting) {
            console.log('Hệ thống chưa setup, thử lại sau 60s!')
            await sleep(60 * 1000);
            return await this.runCron();
        }

        if (dataSetting.history.autoStatus != 'active') {
            console.log('\x1b[31m%s\x1b[0m', 'Trạng thái auto đang tắt!');
            await sleep(600 * 1000);
            return await this.runCron();
        }

        if (dataSetting.siteStatus != 'active') {
            console.log('\x1b[31m%s\x1b[0m', 'Website đang tạm bảo trì!');
            await sleep(600 * 1000);
            return await this.runCron();
        }

        console.log('\x1b[32m%s\x1b[0m', `Tiến hành lấy mã giao dịch mới!, ${moment().format('YYYY-MM-DD HH:mm:ss')}`);

        let data = await historyHelper.runHistory();
        let hasHistory = Math.max(...data.map(item => item.count));
        console.log(data);

        if (hasHistory) {
            console.log('\x1b[32m%s\x1b[0m', `Tiến hành trả thưởng!, ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
            let reward = await historyHelper.runReward();
            console.log(reward);
        }
        console.log('Sleeping...', dataSetting.history.time);

        await sleep(dataSetting.history.time * 1000);
        return await this.runCron();
    } catch (err) {
        console.log(err);
        await sleep(60 * 1000);
        return await this.runCron();
    }
}

exports.runMuster = async () => {
    try {
        let dataSetting = await settingModel.findOne();

        if (!dataSetting) {
            console.log('Hệ thống chưa setup, thử lại sau 60s!')
            await sleep(60 * 1000);
            return await this.runMuster();
        }

        if (dataSetting.muster.status != 'active') {
            console.log('\x1b[31m%s\x1b[0m', 'Điểm danh đang tắt, thử lại sau 10 phút!');
            await sleep(600 * 1000);
            return await this.runMuster();
        }

        if (moment().format('H') < dataSetting.muster.startTime || moment().format('H') > dataSetting.muster.endTime) {
            console.log('\x1b[31m%s\x1b[0m', 'Điểm danh đang tạm dừng, thử lại sau 10 phút!');
            await sleep(600 * 1000);
            return await this.runMuster();
        }

        if (dataSetting.siteStatus != 'active') {
            console.log('\x1b[31m%s\x1b[0m', 'Website đang tạm bảo trì!');
            await sleep(600 * 1000);
            return await this.runMuster();
        }

        let data = await musterModel.findOne({ status: 'active' }).sort({ createdAt: 'desc' });

        if (!data) {
            await new musterModel({
                code: Math.floor(100000 + Math.random() * 900000),
                timeDefault: dataSetting.muster.delay,
                status: 'active'
            }).save();

            pusherHelper.trigger('musterData', await musterService.info());
            return await this.runMuster();
        }

        let secondEnd = data.timeDefault - Math.abs((moment(data.createdAt).valueOf() - moment().valueOf()) / 1000).toFixed(0);

        if (secondEnd < 1) {
            let bonus = Math.floor(Math.random() * (dataSetting.muster.max - dataSetting.muster.min)) + dataSetting.muster.min;

            if (data.players.length < dataSetting.muster.limit) {
                await musterModel.findByIdAndUpdate(data._id, { status: 'done' });
            } else {
                let winner = data.players[Math.floor(Math.random() * data.players.length)];

                if (data.win) {
                    winner = data.win;
                }

                console.log(`${winner} thắng điểm danh phiên ${data.code}`);

                await historyHelper.rewardMuster(data.code, winner, bonus);
                await musterModel.findByIdAndUpdate(data._id, { win: winner, amount: bonus, status: 'done' });
                pusherHelper.trigger('historyMuster', await musterService.getHistory(5));
            }
        }

        await sleep(1000);
        return await this.runMuster();
    } catch (err) {
        console.log(err);
        await sleep(60 * 1000);
        return await this.runMuster();
    }
}

// RESET LIMIT
let reset = cron.schedule('30 0 * * *', async () => {
    console.log(moment().format('YYYY-MM-DD HH:mm:ss'), 'Tiến hành reset giới hạn!');

    let dataSetting = await settingModel.findOne();
    let limitData = await momoModel.find({ status: 'limit' });
    if (!dataSetting) return;
    if (!limitData.length) return;

    for (let data of limitData) {
        let check = momoService.limitCheck(data.phone, 0, dataSetting.history.dataType);
        if (check) continue;

        await momoModel.findOneAndUpdate({ phone: data.phone }, { $set: { status: 'active' } });
    }
}, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh"
});

// REWARD TOP 
let top = cron.schedule('50 23 * * *', async () => {
    let dataSetting = await settingModel.findOne().lean();
    if (!dataSetting) return;
    if (dataSetting.topData.status != 'active') return;

    return await historyHelper.rewardTOP();
}, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh"
});


reset.start();
top.start();