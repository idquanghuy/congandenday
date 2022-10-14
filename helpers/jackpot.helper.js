const historyJackpot = require('../models/history-jackpot.model');
const transferModel = require('../models/transfer.model');
const settingModel = require('../models/setting.model');
const momoModel = require('../models/momo.model');
const momoHelper = require('../helpers/momo.helper');
const logHelper = require('../helpers/log.helper');
const momoService = require('../services/momo.service');

exports.checkWin = async (transId, numberTLS) => {
    try {
        let win;
        for (let i = 0; i < numberTLS.length; i++) {
            let number = String(numberTLS[i]);
            let id = String(transId);
            if (id.slice(-number.length) == number) {
                win = true;
                break;
            }
        }
        if (!win) return;

        let jackpot = await this.jackpotCount();
        await settingModel.findOneAndUpdate({}, { $set: { jackpotCount: 0 } })
        return jackpot;
    } catch (err) {
        console.log(err);
        return;
    }
}

exports.rewardJackpot = async (phone, receiver, transId, amount) => {
    try {
        const dataSetting = await settingModel.findOne();
        const dataPhone = await momoModel.findOne({ phone, status: 'active', loginStatus: 'active' });
        let data = await historyJackpot.findOne({ receiver, transId });

        if (!dataPhone) {
            await logHelper.create('rewardJackpot', `${phone}|${transId}| Trả nổ hũ thất bại: Số điện thoại không tồn tại hoặc không hoạt động!`);
        }

        if (!data) {
            await historyJackpot.findOneAndUpdate({ receiver, transId }, { $set: { receiver, transId, amount, status: 'wait' } }, { upsert: true });
        }

        if (data && data.status != 'wait') {
            await logHelper.create('rewardJackpot', `${phone}|${receiver}|${transId}| Chỉ trả nổ hũ ở trạng thái wait!`);
            return;
        }

        let comment = `Nổ hũ #${transId}, ${Intl.NumberFormat('en-US').format(amount)}đ`;

        if (await transferModel.findOne({ receiver, amount, comment })) {
            await logHelper.create('rewardJackpot', `${phone}|${receiver}|${transId}| Đã trả thưởng nổ hũ trước đó, không chuyển lại!`);
            return;
        }

        let checkLimit = await momoService.limitCheck(phone, amount, dataSetting.history.dataType);

        if (checkLimit) {
            await historyJackpot.findOneAndUpdate({ receiver, transId }, { $set: { status: 'error' } });

            let phoneNew = await momoService.phoneActive('limit', amount, dataSetting.history.dataType);
            if (!phoneNew) {
                console.log('Không tìm thấy số mới #' + transId);
                return;
            }

            checkLimit == 1 ? await logHelper.create('rewardJackpot', `${phone}|${transId} đã đạt giới hạn, đổi sang số ${phoneNew} để trả thưởng!`) : await logHelper.create('rewardJackpot', `${phone}|${transId} không tìm thấy hoặc trạng thái khác, đổi sang số ${phoneNew} để trả thưởng!`);

            await historyJackpot.findOneAndUpdate({ receiver, transId }, { $set: { status: 'wait' } });
            return await this.rewardJackpot(phoneNew, receiver, transId, amount);
        }

        let transfer = await momoHelper.moneyTransfer(phone, { phone: receiver, amount, comment });
        console.log(transfer);

        if (!transfer || !transfer.success) {
            if (!transfer.message.includes('không đủ') && !transfer.message.includes('ECONNRESET')) await momoModel.findOneAndUpdate({ phone }, { $set: { status: 'errorPhone' } });

            await historyJackpot.findOneAndUpdate({ receiver, transId }, { $set: { status: 'error' } });
            await logHelper.create('rewardJackpot', `${phone}|${transId}| Trả nổ hũ thất bại: ${transfer.message}`);

            if (transfer.message.includes('ECONNRESET')) {
                console.log(`${phone} lỗi kết nối!`);
                return;
            }

            let phoneNew = await momoService.phoneActive('money', amount, dataSetting.history.dataType);
            if (!phoneNew) {
                console.log('Không tìm thấy số mới #' + transId);
                return;
            }

            await historyJackpot.findOneAndUpdate({ receiver, transId }, { $set: { status: 'wait' } });
            return await this.rewardJackpot(phoneNew, receiver, transId, amount);
        }

        await historyJackpot.findOneAndUpdate({ receiver, transId }, { $set: { status: 'success' } });
        return ({
            transId,
            ...transfer.data
        });
    } catch (err) {
        console.log(err);
        await historyJackpot.findOneAndUpdate({ receiver, transId }, { $set: { status: 'error' } });
        await logHelper.create('rewardJackpot', `${phone}|${receiver}|${transId}| Có lỗi xảy ra ${err.message || err}`);
        return;
    }
}

exports.jackpotCount = async () => {
    let dataSetting = await settingModel.findOne();
    if (!dataSetting) return 0;

    return dataSetting.jackpotCount;
}