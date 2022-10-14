const momoModel = require('../models/momo.model');
const historyService = require('../services/history.service');

const momoService = {
    getPhone: async (filter, limit = 5, dataType) => {
        let list = [];
        let phones = await momoModel.find(filter).limit(limit);

        for (let dataPhone of phones) {
            let count = await historyService.moneyCount(dataPhone.phone, dataType);
            list.push({
                id: dataPhone._id,
                name: dataPhone.name,
                phone: dataPhone.phone,
                bonus: dataPhone.bonus,
                limitDay: dataPhone.limitDay,
                limitMonth: dataPhone.limitMonth,
                number: dataPhone.count,
                betMin: dataPhone.betMin,
                betMax: dataPhone.betMax,
                ...count,
                status: dataPhone.status
            })
        }
        
        return list;
    },
    phoneRun: async (limit = 5) => await momoModel.find({ status: 'active', loginStatus: 'active' }).limit(limit),
    limitBet: async (phone, amount) => {
        try {
            let dataPhone = await momoModel.findOne({ phone });
            console.log(`${phone}: ${amount} > ${dataPhone.betMax}: ${amount > dataPhone.betMax} hoặc ${amount} < ${dataPhone.betMin}: ${amount < dataPhone.betMin}`)

            return (amount > dataPhone.betMax || amount < dataPhone.betMin) ? true : false
        } catch (err) {
            console.log(err);
            return false;
        }
    },
    limitCheck: async (phone, amount, dataType) => {
        try {
            const dataPhone = await momoModel.findOne({ phone });
            if (!dataPhone) return -1;

            let { limitDay, limitMonth, count } = dataPhone;
            let checkCount = await historyService.moneyCount(phone, dataType);
            console.log(`${phone}: ${checkCount.amountDay + amount}/${limitDay} | ${checkCount.amountMonth + amount}/${limitMonth} | ${checkCount.count + 1}/${count}`)

            if ((checkCount.amountDay + amount) > limitDay || (checkCount.amountMonth + amount) > limitMonth || (checkCount.count + 1) > count) {
                await momoModel.findOneAndUpdate({ phone }, { $set: { status: 'limit' } });
            }

            return ((checkCount.amountDay + amount) > limitDay || (checkCount.amountMonth + amount) > limitMonth || (checkCount.count + 1) > count) ? 1 : 0;
        } catch (err) {
            console.log(err);
            return 0;
        }
    },
    phoneActive: async (oldType, amount, dataType) => {
        if (oldType == 'limit') {
            let dataPhone = await momoModel.findOne({ status: 'active', loginStatus: 'active' });
            if (!dataPhone) return;

            let checkLimit = await momoService.limitCheck(dataPhone.phone, amount, dataType);
            if (checkLimit == 0) return dataPhone.phone;

            return await this.phoneActive(oldType, amount, dataType);
        }

        if (oldType == 'money') {
            let dataPhone = await momoModel.findOne({ status: 'active', loginStatus: 'active', money: { $gte: amount } });
            if (!dataPhone) return;

            return dataPhone.phone;
        }
        
        return;
    }
}

module.exports = momoService;