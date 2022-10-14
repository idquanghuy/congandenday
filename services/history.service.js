const moment = require('moment');
const historyModel = require('../models/history.model');
const transferModel = require('../models/transfer.model');
const settingModel = require('../models/setting.model');

const historyService = {
    moneyCount: async (phone, dataType, month = null) => {
        const date = new Date();

        if (dataType == 'noti') {
            dataMonth = await transferModel.aggregate([{ $match: { phone, createdAt: { $gte: new Date(date.getFullYear(), (month || date.getMonth()), 1), $lt: new Date(date.getFullYear(), (month || date.getMonth()) + 1, 0) } } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]);
            dataDay = await transferModel.aggregate([{ $match: { phone, createdAt: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() } } }, { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } }]);
        } else {
            dataMonth = await historyModel.aggregate([{ $match: { phone, io: -1, timeTLS: { $gte: new Date(date.getFullYear(), (month || date.getMonth()), 1), $lt: new Date(date.getFullYear(), (month || date.getMonth()) + 1, 0) } } }, { $group: { _id: null, amount: { $sum: '$money' } } }]);
            dataDay = await historyModel.aggregate([{ $match: { phone, io: -1, timeTLS: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() } } }, { $group: { _id: null, amount: { $sum: '$money' }, count: { $sum: 1 } } }]);
        }

        return ({ amountDay: !dataDay.length ? 0 : dataDay[0].amount, amountMonth: !dataMonth.length ? 0 : dataMonth[0].amount, count: !dataDay.length ? 0 : dataDay[0].count });
    },
    getTOP: async () => {
        let dataSetting = await settingModel.findOne().lean();
        if (dataSetting.topData.status != 'active') return dataSetting.topData.fakeData;

        let listTOP = [], dataTOP = dataSetting.topData.bonus;
        let list = await historyModel.aggregate([{ $match: { status: 'win', updatedAt: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() } } }, { $group: { _id: "$partnerId", money: { $sum: '$bonus' } } }, { $sort: { money: -1 } }, { $limit: dataTOP.length }]);

        for (let [index, data] of list.entries()) {
            listTOP.push({
                phone: `${data._id.slice(0, 6)}****`,
                amount: data.money,
                bonus: dataTOP[index]
            })
        }

        return listTOP;
    },
    getHistory: async () => {
        let historys = await historyModel.find({ status: 'win' }).sort({ createdAt: 'desc' }).limit(10);
        let list = [];

        for (const history of historys) {
            list.push({
                phone: `${history.partnerId.slice(0, 6)}****`,
                money: history.money,
                bonus: history.bonus,
                gameName: history.gameName,
                content: history.comment,
                status: 'win',
                time: moment(history.timeTLS).format('YYYY-MM-DD HH:mm:ss')
            })
        }

        return list;
    },
    refundCount: async (receiver, limit) => {
        let data = await historyModel.aggregate([{ $match: { partnerId: receiver, status: 'refund', io: 1, timeTLS: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() } } }, { $group: { _id: null, count: { $sum: 1 } } }]);
        data = data.length ? data[0].count : 0;
        return data >= limit;
    }
}

module.exports = historyService;