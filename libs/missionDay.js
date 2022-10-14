const cron = require('node-cron');
const moment = require('moment');
const settingModel = require('../models/setting.model');
const historyModel = require('../models/history.model');
const momoHelper = require('../helpers/momo.helper');
const logHelper = require('../helpers/log.helper');
const momoService = require('../services/momo.service');

let task = cron.schedule('50 23 * * *', async () => {
    let dataSetting = await settingModel.findOne();
    if (!dataSetting) return;
    if (dataSetting.missionData.status != 'active') return;
    if (dataSetting.siteStatus != 'active') return;
    if (!dataSetting.missionData.data.length) return;

    console.log(moment().format('YYYY-MM-DD HH:mm:ss'), `Tiến hành trả thưởng ngày!`);
    let min = Math.min(...dataSetting.missionData.data.map(item => item.amount));
    let missionData = dataSetting.missionData.data;
    let dataDay = await historyModel.aggregate([{ $match: { timeTLS: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() }, $and: [{ $or: [{ status: 'win' }, { status: 'won' }] }] } }, { $group: { _id: '$partnerId', amount: { $sum: '$money' } } }]);

    dataDay = dataDay.filter(item => item.amount >= min);
    if (!dataDay.length) return;

    for (let data of dataDay) {
        let bonus;

        for (let i = 0; i < missionData.length; i++) {
            if (data.amount < missionData[i].amount) continue;
            bonus = missionData[i].bonus;
        }

        if (!bonus) continue;
        let comment = `Tổng cược: ${Intl.NumberFormat('en-US').format(data.amount)}đ, thưởng nhiệm vụ ngày!`;
        let phone = await momoService.phoneActive('money', bonus, dataSetting.history.dataType);

        if (!phone) {
            await logHelper.create('rewardMission', `Trả thưởng nhiệm vụ ngày ${data._id} thất bại! Thưởng: ${Intl.NumberFormat('en-US').format(bonus)}đ, Tổng Cược: ${Intl.NumberFormat('en-US').format(data.amount)}đ. Lỗi: Không có số nào đủ tiền để trả thưởng!`);
            continue;
        }

        let transfer = await momoHelper.moneyTransfer(phone, { phone: data._id, amount: bonus, comment });

        if (!transfer || !transfer.success) {
            await logHelper.create('rewardMission', `Trả thưởng nhiệm vụ ngày ${data._id} thất bại! Thưởng: ${Intl.NumberFormat('en-US').format(bonus)}đ, Tổng Cược: ${Intl.NumberFormat('en-US').format(data.amount)}đ. Lỗi: ${transfer.message}`);
        }

        await logHelper.create('rewardMission', `Trả thưởng nhiệm vụ ngày ${data._id} thành công! Thưởng: ${Intl.NumberFormat('en-US').format(bonus)}đ, Tổng Cược: ${Intl.NumberFormat('en-US').format(data.amount)}đ`);
    }
}, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh"
});
task.start();