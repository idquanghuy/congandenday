const moment = require('moment');
const historyModel = require('../models/history.model');
const transferModel = require('../models/transfer.model');
const settingModel = require('../models/setting.model');

const revenueService = {
    revenueBet: async (time, typeDate, phone) => {
        try {
            let filterWin = [{ $match: { status: 'win' } }, { $group: { _id: null, count: { $sum: 1 } } }]
            let filterWon = [{ $match: { status: 'won' } }, { $group: { _id: null, count: { $sum: 1 } } }];
            let filterWait = [{ $match: { $and: [{ $or: [{ status: 'wait' }, { status: 'waitReward' }, { status: 'waitRefund' }] }] } }, { $group: { _id: null, count: { $sum: 1 } } }];
            let filterError = [{ $match: { $and: [{ $or: [{ status: 'errorMoney' }, { status: 'limitPhone' }, { status: 'limitBet' }, { status: 'errorComment' }, { status: 'errorPhone' }, { status: 'phoneBlock' }] }] } }, { $group: { _id: null, count: { $sum: 1 } } }];
            let filterRefund = [{ $match: { $and: [{ $or: [{ status: 'refund' }, { status: 'limitRefund' }] }] } }, { $group: { _id: null, count: { $sum: 1 } } }];

            if (phone) {
                filterWin[0].$match.phone = phone;
                filterWon[0].$match.phone = phone;
                filterWait[0].$match.phone = phone;
                filterError[0].$match.phone = phone;
                filterRefund[0].$match.phone = phone;
            }

            if (time && typeDate) {
                filterWin[0].$match.timeTLS = { $gte: moment(time).startOf(typeDate).toDate(), $lt: moment(time).endOf(typeDate).toDate() }
                filterWon[0].$match.timeTLS = { $gte: moment(time).startOf(typeDate).toDate(), $lt: moment(time).endOf(typeDate).toDate() }
                filterWait[0].$match.timeTLS = { $gte: moment(time).startOf(typeDate).toDate(), $lt: moment(time).endOf(typeDate).toDate() }
                filterError[0].$match.timeTLS = { $gte: moment(time).startOf(typeDate).toDate(), $lt: moment(time).endOf(typeDate).toDate() }
                filterRefund[0].$match.timeTLS = { $gte: moment(time).startOf(typeDate).toDate(), $lt: moment(time).endOf(typeDate).toDate() }
            }

            let [win, won, wait, error, refund] = await Promise.all([historyModel.aggregate(filterWin), historyModel.aggregate(filterWon), historyModel.aggregate(filterWait), historyModel.aggregate(filterError), historyModel.aggregate(filterRefund)]);

            win = win.length ? win[0].count : 0;
            won = won.length ? won[0].count : 0;
            wait = wait.length ? wait[0].count : 0;
            error = error.length ? error[0].count : 0;
            refund = refund.length ? refund[0].count : 0;

            return ({
                success: true,
                wait,
                win,
                won,
                error,
                refund
            })

        } catch (err) {
            console.log(err);
            return ({
                success: false,
                wait: 0,
                win: 0,
                won: 0,
                error: 0,
                refund: 0
            })
        }
    },
    revenueMoney: async (time, typeDate, phone) => {
        try {
            let dataSetting = await settingModel.findOne();
            let filterReceipt = [{ $match: { io: 1, comment: { $ne: dataSetting.paymentComment } } }, { $group: { _id: null, amount: { $sum: '$money' } } }];
            let filterMinus = [{ $match: { comment: { $ne: dataSetting.withdrawComment } } }, { $group: { _id: null, amount: { $sum: '$money' } } }]

            if (phone) {
                filterReceipt[0].$match.phone = phone;
                filterMinus[0].$match.phone = phone;
            }

            if(dataSetting.history.dataType == 'history'){
                filterMinus[0].$match.io = -1;
            }

            if(dataSetting.history.dataType == 'noti'){
                filterMinus[1].$group.amount = { $sum: '$amount' };
            }

            if (time && typeDate) {
                filterReceipt[0].$match.timeTLS = { $gte: moment(time).startOf(typeDate).toDate(), $lt: moment(time).endOf(typeDate).toDate() };
                dataSetting.history.dataType == 'history' ? filterMinus[0].$match.timeTLS : filterMinus[0].$match.createdAt = { $gte: moment(time).startOf(typeDate).toDate(), $lt: moment(time).endOf(typeDate).toDate() };
            }

            let [receipt, minus] = await Promise.all([historyModel.aggregate(filterReceipt), dataSetting.history.dataType == 'history' ? historyModel.aggregate(filterMinus) : transferModel.aggregate(filterMinus)]);

            receipt = receipt.length ? receipt[0].amount : 0;
            minus = minus.length ? minus[0].amount : 0;
            let earning = receipt - minus;

            return ({
                success: true,
                receipt,
                minus,
                earning
            })
        } catch (err) {
            console.log(err);
            return ({
                success: false,
                receipt: 0,
                minus: 0,
                earning: 0
            })
        }
    },
}

module.exports = revenueService;
