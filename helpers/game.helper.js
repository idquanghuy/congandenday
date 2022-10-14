const gameService = require('../services/game.service');
const momoService = require('../services/momo.service');
const rewardModel = require('../models/reward.model');
const momoModel = require('../models/momo.model');

exports.checkWin = async (phone, money, transId, comment) => {
    try {
        let dataPhone = await momoModel.findOne({ phone });
        comment = comment ? comment.replace(/^\s+|\s+$/gm, '') : comment;
        let checkVaild = await gameService.checkGame(comment);

        if (!checkVaild.gameName) return ({
            gameType: null,
            status: 'errorComment',
            win: false,
            won: false,
            bonus: 0
        })

        let gameType = checkVaild.gameType;
        let rewardData = await rewardModel.find({ content: { $regex: `^${comment}$`, $options: 'i' } });
        let status, win = false, won = false, bonus = 0;

        for (let rewardContent of rewardData) {
            let { numberTLS, resultType, amount } = rewardContent;
            let id = String(transId);

            if (resultType.includes('count_')) id = String(transId).slice(-Number(resultType.replace(/[^\d]/g, ''))).split('').reduce((count, value) => count + Number(value), 0);
            if (resultType.includes('minus_')) id = String(transId).slice(-Number(resultType.replace(/[^\d]/g, ''))).split('').reduce((count, value) => count - Number(value), 0);

            for (let i = 0; i < numberTLS.length; i++) {
                let number = String(numberTLS[i]);
                if (id.slice(-number.length) == number) {
                    bonus = dataPhone.bonus > 1 ? dataPhone.bonus : amount;
                    win = true;
                    break;
                }
            }
        }

        status = win ? 'waitReward' : 'won';
        if (!win) won = true;
        if (await momoService.limitBet(phone, money)) {
            status = 'limitBet';
        }

        console.log({
            gameType,
            status,
            win,
            won,
            bonus
        });

        return ({
            gameType,
            status,
            win,
            won,
            bonus
        })
    } catch (err) {
        console.log(err);
        return ({
            gameType: null,
            status: null,
            win: false,
            won: false,
            bonus: 0
        })
    }
}