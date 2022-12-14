"use strict";
const moment = require("moment");
const historyModel = require('../models/history.model');
const momoModel = require('../models/momo.model');
const settingModel = require('../models/setting.model');
const transferModel = require('../models/transfer.model');
const blockModel = require('../models/block.model');
const logHelper = require('../helpers/log.helper');
const momoHelper = require('../helpers/momo.helper');
const gameHelper = require('../helpers/game.helper');
const jackpotHelper = require('../helpers/jackpot.helper');
const pusherHelper = require('../helpers/pusher.helper');
const gameService = require('../services/game.service');
const historyService = require('../services/history.service');
const momoService = require('../services/momo.service');
const jackpotService = require('../services/jackpot.service');

exports.runDetails = async (phone, data) => {
    let threads = [];

    for (let history of data) {
        if (await historyModel.findOne({ transId: history.transId })) continue;
        threads.push(momoHelper.getDetails(phone, history.transId))
    }

    return await Promise.all(threads);
}

exports.runHistory = async () => {
    const dataSetting = await settingModel.findOne();
    let threads = [];

    let dataPhone = await momoService.phoneRun(dataSetting.limitPhone);

    for (let data of dataPhone) {
        threads.push(this.getHistory(data.phone, dataSetting.history));
    }

    return await Promise.all(threads);
}

exports.runReward = async () => {
    const dataSetting = await settingModel.findOne();
    let threads = [];

    let dataPhone = await momoService.phoneRun(dataSetting.limitPhone);

    for (let data of dataPhone) {
        threads.push(this.rewardPhone(data.phone));
    }

    return await Promise.all(threads);
}

exports.runError = async (arrayStatus) => {
    let list = [];
    let array = arrayStatus.map((item) => ({ status: item }));
    let listError = await historyModel.find({ io: 1, $and: [{ $or: array }] });

    for (let data of listError) {
        if (!arrayStatus.includes(data.status)) continue;
        let runReward = await this.rewardTransId(data.phone, data.transId);
        if (!runReward) continue;
        list.push(runReward);
    }

    return list;
}

exports.getHistory = async (phone, configHistory) => {
    try {
        let list = [];
        let dataHistory = await momoHelper.getHistory(phone, configHistory);
        if (!dataHistory || !dataHistory.success) {
            return ({
                phone,
                message: dataHistory.message
            })
        }
        if (dataHistory.data.length) await momoHelper.getBalance(phone)

        if (configHistory.dataType != 'noti') {
            let details = await this.runDetails(phone, dataHistory.data);
            for (let detail of details) {
                if (detail.success) {
                    list.push(detail.data);
                }
            }
        } else {
            list.push(...dataHistory.data)
        }

        let detailThread = list.map((history) => this.handleTransId(history));
        let data = await Promise.all(detailThread);
        data = data.filter(item => item);

        return ({
            phone,
            count: data.length,
            history: data
        })
    } catch (err) {
        console.log(err);
        await logHelper.create('getHistory', phone + '| C?? l???i x???y ra ' + err.message || err);
        return ({
            phone,
            message: 'C?? l???i x???y ra ' + err.message || err
        });
    }
}

exports.handleTransId = async (data) => {
    try {
        if (await historyModel.findOne({ transId: data.transId })) return;

        let dataSetting = await settingModel.findOne();
        let { phone, io, transId, partnerId, partnerName, targetId, targetName, amount, comment, time } = data;

        partnerId = momoHelper.convertPhone(partnerId);
        targetId = momoHelper.convertPhone(targetId);

        let { gameName, gameType } = await gameService.checkGame(comment);
        let status = io == 1 ? 'wait' : 'transfer';

        if (io == 1 && (!gameName || !gameType)) comment && comment.includes(dataSetting.paymentComment) ? status = 'recharge' : status = 'errorComment';

        if (status == 'wait') {
            if (await momoService.limitBet(phone, amount)) {
                await historyService.refundCount(partnerId, dataSetting.refund.limit || 10) ? status = 'limitRefund' : status = 'limitBet';
            }
        }

        await historyModel.findOneAndUpdate({ phone, transId }, { $set: { io, transId, phone, partnerId, partnerName, targetId, targetName, gameName, gameType, money: amount, postBalance: data.postBalance || 0, comment, status, timeTLS: new Date(time) } }, { upsert: true });

        return ({
            transId,
            amount,
            comment
        })
    } catch (err) {
        console.log(err);
        await logHelper.create('handleTransId', `${data.phone}|${data.transId}| C?? l???i x???y ra ${err.message || err}`);
        return;
    }
}


exports.rewardPhone = async (phone) => {
    let dataHistory = await historyModel.find({ phone, io: 1, status: 'wait' });
    let list = [];

    for (let data of dataHistory) {
        let runReward = await this.rewardTransId(phone, data.transId);
        if (!runReward) continue;
        list.push(runReward);
    }

    return ({
        phone,
        reward: list
    })
}

exports.rewardTransId = async (phone, transId) => {
    try {
        if (!phone) {
            let newData = await momoModel.findOne({ status: 'active', loginStatus: 'active' });

            if (!newData) {
                console.log('Kh??ng t??m th???y s??? m???i #' + transId);
                return;
            }

            phone = newData.phone;
        }

        const dataSetting = await settingModel.findOne();
        const dataPhone = await momoModel.findOne({ phone, status: 'active', loginStatus: 'active' });
        const dataHistory = await historyModel.findOne({ transId, io: 1 });

        if (!dataPhone) {
            console.log(`S??? ??i???n tho???i kh??ng ho???t ?????ng, ${phone} #` + transId);
            return;
        }

        if (!dataHistory) {
            console.log('Kh??ng t??m th???y l???ch s??? #' + transId);
            return;
        }

        // Check User Block
        if (await blockModel.findOne({ phone: dataHistory.partnerId, status: 'active' })) {
            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'phoneBlock' } });
            console.log(`${dataHistory.partnerId} ???? b??? ch???n, b??? qua!`);
            return;
        }

        let { gameType, status, win, won, bonus } = await gameHelper.checkWin(dataHistory.phone, dataHistory.money, dataHistory.transId, dataHistory.comment);

        if (await historyModel.findOne({
            transId, io: 1,
            $and: [
                {
                    $or: [
                        {
                            status: 'waitReward'
                        },
                        {
                            status: 'waitRefund'
                        },
                        {
                            status: 'win'
                        },
                        {
                            status: 'won'
                        },
                        {
                            status: 'refund'
                        },
                        {
                            status: 'limitRefund'
                        }
                    ]
                }
            ]
        })) {
            console.log('M?? giao d???ch n??y ??ang x??? l?? ho???c ???? x??? l??, b??? qua! #' + transId);
            return;
        }

        if (dataHistory.status == 'limitBet' || dataHistory.status == 'errorComment' || status == 'errorComment' || status == 'limitBet') {
            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'waitRefund', description: `Ho??n ti???n l?? do: ${(dataHistory.status == 'limitBet' || status == 'limitBet') ? 'Sai h???n m???c!' : 'Sai n???i dung!'}` } });

            if (dataSetting.refund.status != 'active') {
                await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'limitRefund', description: 'Kh??ng ho??n ti???n!' } });
                console.log('H??? th???ng kh??ng h??? tr??? ho??n ti???n #' + transId);
                return;
            }

            if (await historyService.refundCount(dataHistory.partnerId, dataSetting.refund.limit || 10)) {
                await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'limitRefund', description: 'Kh??ng ho??n ti???n, v?? ???? qu?? h???n ng??y h??m nay!' } });
                console.log('V?????t qua gi???i h???n ho??n ti???n #' + transId);
                return;
            }

            let moneyRefund = dataHistory.money;
            let refundComment = `Ho??n ti???n #${transId}, ${(dataHistory.status == 'limitBet' || status == 'limitBet') ? 'Sai h???n m???c!' : 'Sai n???i dung!'}`;

            if (dataHistory.status != 'errorComment' && status != 'errorComment') moneyRefund = Math.round(win ? (dataSetting.refund.win * moneyRefund / 100) : (dataSetting.refund.won * moneyRefund / 100));
            if (moneyRefund < 100) await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'refund', description: `${moneyRefund} kh??ng ????? ??i???u ki???n ????? chuy???n, mi???n ho??n!` } });

            let checkLimit = await momoService.limitCheck(phone, moneyRefund, dataSetting.history.dataType);

            if (checkLimit) {
                checkLimit == 1 ? await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'limitPhone' } }) : await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'errorPhone', description: 'L???i s???, kh??ng t??m th???y ho???c tr???ng th??i ???? ???????c thay ?????i!' } });
                pusherHelper.trigger('phoneData', await momoService.getPhone({ status: 'active', loginStatus: 'active' }, dataSetting.limitPhone, dataSetting.history.dataType));

                let phoneNew = await momoService.phoneActive('limit', moneyRefund, dataSetting.history.dataType);
                if (!phoneNew) {
                    console.log('Kh??ng t??m th???y s??? m???i #' + transId);
                    return;
                }

                checkLimit == 1 ? await logHelper.create('rewardTransId', `${phone}|${transId} ???? ?????t gi???i h???n, ?????i sang s??? ${phoneNew} ????? tr??? th?????ng!`) : await logHelper.create('rewardTransId', `${phone}|${transId} kh??ng t??m th???y ho???c tr???ng th??i kh??c, ?????i sang s??? ${phoneNew} ????? tr??? th?????ng!`);

                await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'wait' } });
                return await this.rewardTransId(phoneNew, transId);
            }
            if (!await historyModel.findOne({ transId, io: 1, status: 'waitRefund' })) {
                console.log(`${transId} ???? x??? l?? ho???c kh??ng t???n t???i!`);
                return;
            }

            if (await transferModel.findOne({ receiver: dataHistory.partnerId, amount: moneyRefund, comment: refundComment })) {
                console.log(`#${transId} ???? ???????c chuy???n ti???n tr?????c ????, b??? qua!`);
                return;
            }

            let transfer = await momoHelper.moneyTransfer(phone, { phone: dataHistory.partnerId, amount: moneyRefund, comment: refundComment });
            console.log(transfer);

            if (!transfer || !transfer.success) {
                if (await this.handleTransfer(phone, transId, transfer.message)) return;
                await logHelper.create('rewardTransId', `${phone}|${transId}| Ho??n ti???n th???t b???i: ${transfer.message}`);

                let phoneNew = await momoService.phoneActive('money', moneyRefund, dataSetting.history.dataType);
                if (!phoneNew) {
                    console.log('Kh??ng t??m th???y s??? m???i #' + transId);
                    return;
                }

                await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: dataHistory.status } });
                return await this.rewardTransId(phoneNew, transId);
            }

            pusherHelper.trigger('phoneData', await momoService.getPhone({ status: 'active', loginStatus: 'active' }, dataSetting.limitPhone, dataSetting.history.dataType));
            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'refund', bonus: moneyRefund } });
            return ({
                phone,
                transId,
                status: 'refund',
                data: transfer.data
            });

        }

        if (status) await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status } });
        let jackpot = await jackpotHelper.checkWin(transId, dataSetting.jackpot.numberTLS);
        if (jackpot) await jackpotHelper.rewardJackpot(phone, dataHistory.partnerId, transId, jackpot);
        if (!win || status != 'waitReward') return;

        let rewardComment = `${dataHistory.comment}: ${dataHistory.transId}, ${dataHistory.money} x ${bonus}`;
        let moneyBonus = Math.round(dataHistory.money * bonus);

        let isJackpot;
        if (dataSetting.jackpot.status == 'active') {
            let checkJackpot = await jackpotService.checkJoin(dataHistory.partnerId);
            if (checkJackpot.isJoin == 1) {
                if (Math.round(moneyBonus - dataSetting.jackpot.amount) > 100) {
                    moneyBonus = Math.round(moneyBonus - dataSetting.jackpot.amount);
                    rewardComment += `, tr??? ${dataSetting.jackpot.amount}?? ti???n h??`;
                    isJackpot = true;
                }
            }
        }

        if (!await historyModel.findOne({ transId, io: 1, status: 'waitReward' })) return;

        let checkLimit = await momoService.limitCheck(phone, moneyBonus, dataSetting.history.dataType);

        if (checkLimit) {
            checkLimit == 1 ? await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'limitPhone' } }) : await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'errorPhone' } });
            pusherHelper.trigger('phoneData', await momoService.getPhone({ status: 'active', loginStatus: 'active' }, dataSetting.limitPhone, dataSetting.history.dataType));

            let phoneNew = await momoService.phoneActive('limit', moneyBonus, dataSetting.history.dataType);
            if (!phoneNew) {
                console.log('Kh??ng t??m th???y s??? m???i #' + transId);
                return;
            }

            checkLimit == 1 ? await logHelper.create('rewardTransId', `${phone}|${transId} ???? ?????t gi???i h???n, ?????i sang s??? ${phoneNew} ????? tr??? th?????ng!`) : await logHelper.create('rewardTransId', `${phone}|${transId} kh??ng t??m th???y ho???c tr???ng th??i kh??c, ?????i sang s??? ${phoneNew} ????? tr??? th?????ng!`);

            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'wait' } });
            return await this.rewardTransId(phoneNew, transId);
        }

        if (!await historyModel.findOne({ transId, io: 1, status: 'waitReward' })) return;

        if (await transferModel.findOne({ receiver: dataHistory.partnerId, amount: moneyBonus, comment: rewardComment })) {
            console.log(`#${transId} ???? ???????c chuy???n ti???n tr?????c ????, b??? qua!`);
            return;
        }

        let transfer = await momoHelper.moneyTransfer(phone, { phone: dataHistory.partnerId, amount: moneyBonus, comment: rewardComment });

        if (!transfer || !transfer.success) {
            if (await this.handleTransfer(phone, transId, transfer.message)) return;
            await logHelper.create('rewardTransId', `${phone}|${transId}| Tr??? th?????ng th???t b???i: ${transfer.message}`);

            let phoneNew = await momoService.phoneActive('money', moneyBonus, dataSetting.history.dataType);
            if (!phoneNew) {
                console.log('Kh??ng t??m th???y s??? m???i #' + transId);
                return;
            }

            await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'wait' } });
            return await this.rewardTransId(phoneNew, transId);
        }

        pusherHelper.trigger('phoneData', await momoService.getPhone({ status: 'active', loginStatus: 'active' }, dataSetting.limitPhone, dataSetting.history.dataType));
        pusherHelper.trigger('historyData', await historyService.getHistory());
        pusherHelper.trigger('notiWin', {
            phone: `${dataHistory.partnerId.slice(0, 6)}****`,
            gameType,
            amount: moneyBonus
        });
        await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'win', bonus: moneyBonus } });

        if (isJackpot) {
            await jackpotService.updateJackpot(dataHistory.partnerId, dataSetting.jackpot.amount);
        }

        return ({
            phone,
            transId,
            status: 'win',
            data: transfer.data
        });

    } catch (err) {
        console.log(err);
        await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'wait' } });
        await logHelper.create('rewardTransId', `${phone}|${transId}| C?? l???i x???y ra ${err.message || err}`);
        return;
    }
}

exports.handleTransfer = async (phone, transId, message) => {
    if (message.includes('kh??ng ?????')) {
        await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'errorMoney' } });
        console.log(`${phone} s??? d?? kh??ng ????? #` + transId);
        return;
    }

    if (message.includes('ECONNRESET')) {
        await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'errorPhone', description: 'Chuy???n ti???n th???t b???i, ECONNRESET!' } });
        console.log(`${phone} l???i m???t k???t n???i #` + transId);
        return true;
    }

    if (message.includes('The "data" argument must be of type string or an instance of Buffer')) {
        await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'errorPhone', description: `Chuy???n ti???n th???t b???i, ${message}!` } });
        return true;
    }

    await momoModel.findOneAndUpdate({ phone }, { $set: { status: 'error' } });
    await historyModel.findOneAndUpdate({ transId, io: 1 }, { $set: { status: 'errorPhone', description: `Chuy???n ti???n th???t b???i, ${message}` } });
    return;
}

exports.checkTransId = async (transId, phone) => {
    try {
        if (!phone) {
            let data = await historyModel.findOne({ transId, io: 1 });
            if (!data) return;

            let dataResult = await gameHelper.checkWin(data.phone, data.money, data.transId, data.comment);
            let result = dataResult.status == 'errorComment' ? 'unknown' : (dataResult.win ? 'win' : 'won');
            let status;

            if (data.status == 'limitBet' || data.status == 'errorComment' || data.status == 'limitRefund') {
                status = data.status;
            } else if (data.status == 'errorMoney' || data.status == 'limitPhone' || data.status == 'errorPhone' || data.status == 'phoneBlock') {
                status = 'error';
            } else if (data.status == 'refund' || data.status == 'win' || data.status == 'won') {
                status = 'done';
            } else {
                status = 'wait';
            }

            return ({
                phone: `${data.partnerId.slice(0, 6)}****`,
                transId,
                gameName: data.gameName,
                amount: data.money,
                comment: data.comment,
                bonus: data.bonus || 0,
                result,
                status,
                time: moment(data.timeTLS).format('YYYY-MM-DD HH:mm:ss')
            })
        }

        let data = await historyModel.findOne({ transId, io: 1 });
        if (data) return await this.checkTransId(transId);

        let details = await momoHelper.getDetails(phone, transId);
        if (!details || !details.success) return;

        await this.handleTransId(details.data);
        return await this.checkTransId(transId);

    } catch (err) {
        console.log(err);
        return;
    }
}

exports.rewardTOP = async () => {
    try {
        const dataSetting = await settingModel.findOne();
        if (!dataSetting) return;
        if (dataSetting.topData.status != 'active') return;

        let dataTOP = dataSetting.topData.bonus;
        let list = await historyModel.aggregate([{ $match: { status: 'win', updatedAt: { $gte: moment().startOf('day').toDate(), $lt: moment().endOf('day').toDate() } } }, { $group: { _id: "$partnerId", money: { $sum: '$bonus' } } }, { $sort: { money: -1 } }, { $limit: dataTOP.length }]);

        console.log(`Ti???n h??nh tr??? th?????ng top ng??y!, ${moment().format('YYYY-MM-DD HH:mm:ss')}`)
        if (!list.length) return;

        for (let [index, data] of list.entries()) {
            let phone = data._id;
            let bonus = dataTOP[index];
            let comment = `Tr??? th?????ng TOP ${index + 1}, th?????ng: ${Intl.NumberFormat('en-US').format(bonus)}??. [${moment().format('YYYY-MM-DD')}]`;
            if (bonus < 100) continue;

            if (await transferModel.findOne({ receiver: phone, amount: bonus, comment })) {
                console.log(`${phone} ???? ???????c chuy???n ti???n th?????ng top tr?????c ????, b??? qua!`);
                return;
            }
            let phoneRun = await momoService.phoneActive('money', bonus, dataSetting.history.dataType);

            if (!phoneRun) {
                await logHelper.create('rewardTOP', `Tr??? th?????ng top ng??y ${phone} th???t b???i! Th?????ng: ${Intl.NumberFormat('en-US').format(bonus)}??, T???ng Th???ng: ${Intl.NumberFormat('en-US').format(data.money)}??. L???i: Kh??ng c?? s??? n??o ????? ti???n ????? tr??? th?????ng!`);
                continue;
            }

            let transfer = await momoHelper.moneyTransfer(phoneRun, { phone, amount: bonus, comment });

            if (!transfer || !transfer.success) {
                await logHelper.create('rewardTOP', `Tr??? th?????ng top ng??y ${phone} th???t b???i! Th?????ng: ${Intl.NumberFormat('en-US').format(bonus)}??, T???ng Th???ng: ${Intl.NumberFormat('en-US').format(data.money)}??. L???i: ${transfer.message}`);
                continue;
            }

            await logHelper.create('rewardTOP', `Tr??? th?????ng top ng??y ${phone} th??nh c??ng! Th?????ng: ${Intl.NumberFormat('en-US').format(bonus)}??, T???ng Th???ng: ${Intl.NumberFormat('en-US').format(data.money)}??`);
        }

        console.log(`Tr??? th?????ng top ng??y th??nh c??ng!, ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
        return true;
    } catch (err) {
        await logHelper.create('rewardTOP', `Tr??? th?????ng top th???t b???i: ${err.message || err}`);
        return;
    }
}

exports.rewardMuster = async (code, phone, amount) => {
    try {
        console.log(`Ti???n h??nh tr??? th?????ng ??i???m danh!, ${moment().format('YYYY-MM-DD HH:mm:ss')}`)

        const dataSetting = await settingModel.findOne();
        if (!dataSetting) return;

        let comment = `#${code} th???ng ??i???m danh ${Intl.NumberFormat('en-US').format(amount)}??`;
        if (amount < 100) return;

        if (await transferModel.findOne({ receiver: phone, amount, comment })) {
            console.log(`#${code}, ${phone} ???? ???????c th?????ng ti???n ??i???m danh tr?????c ????, b??? qua!`);
            return;
        }

        let phoneRun = await momoService.phoneActive('money', amount, dataSetting.history.dataType);

        if (!phoneRun) {
            await logHelper.create('rewardMuster', `Tr??? th?????ng ??i???m danh ${phone} th???t b???i! M??: #${code}, th?????ng: ${Intl.NumberFormat('en-US').format(amount)}??. L???i: Kh??ng c?? s??? n??o ????? ti???n ????? tr??? th?????ng!`);
            return;
        }

        let transfer = await momoHelper.moneyTransfer(phoneRun, { phone, amount, comment });

        if (!transfer || !transfer.success) {
            await logHelper.create('rewardMuster', `Tr??? th?????ng ??i???m danh ${phone} th???t b???i! M??: #${code}, th?????ng: ${Intl.NumberFormat('en-US').format(amount)}??. L???i: ${transfer.message}`);
            return;
        }

        await logHelper.create('rewardMuster', `Tr??? th?????ng ??i???m danh ${phone} th??nh c??ng! M??: #${code}, th?????ng: ${Intl.NumberFormat('en-US').format(amount)}??`);

    } catch (err) {
        await logHelper.create('rewardTOP', `Tr??? th?????ng ??i???m danh th???t b???i: ${err.message || err}`);
        return;
    }
}