const gameModel = require('../models/game.model');
const rewardModel = require('../models/reward.model');

const gameService = {
    getGame: async () => await gameModel.find({ display: 'show' }, { _id: 0, __v: 0, createdAt: 0, updatedAt: 0 }),
    checkGame: async (comment) => {
        try {
            comment = comment ? comment.replace(/^\s+|\s+$/gm, '') : comment;
            let reward = await rewardModel.findOne({ content: { $regex: `^${comment}$`, $options: 'i' } });
            let game = await gameModel.findOne({ gameType: reward.gameType, display: 'show' });

            return ({
                gameName: game.name,
                gameType: reward.gameType
            })
        } catch (err) {
            return ({
                gameName: null,
                gameType: null,
            })
        }
    },
}

module.exports = gameService;