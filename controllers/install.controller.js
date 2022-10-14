const gameModel = require("../models/game.model");
const rewardModel = require("../models/reward.model");
const userModel = require("../models/user.model");
const settingModel = require("../models/setting.model");
const gameData = require('../json/games.json');
const rewardData = require('../json/rewards.json');

const installController = {
    index: async (req, res, next) => {
        let games = await gameModel.findOne() ? false : true;
        let users = await userModel.findOne() ? false : true;
        res.render('page/install', { games, users });
    },
    setupToken: async (req, res, next) => {
        try {
            let TOKEN_SETUP = req.params.TOKEN_SETUP;

            if (process.env.TOKEN_SETUP != TOKEN_SETUP) {
                return res.json({
                    success: false,
                    message: 'Invaild Token Setup!'
                })
            }

            // REMOVE DATA BEFORE
            await gameModel.deleteMany();
            await rewardModel.deleteMany();

            // INSTALL DATA JSON
            await gameModel.insertMany(gameData);
            await rewardModel.insertMany(rewardData);

            return res.json({
                success: true,
                message: 'Successfully'
            })
        } catch (err) {
            next(err);
        }
    },
    createSetting: async (req, res, next) => {
        try {
            let { TOKEN_SETUP, nameSite, defaultTitle, description, keywords, favicon, thumbnail, gameNote, limitPhone, paymentComment, withdrawComment, missionData, topData, history, refund, notification, siteStatus } = req.body;

            if (process.env.TOKEN_SETUP != TOKEN_SETUP) {
                return res.json({
                    success: false,
                    message: 'Invaild Token Setup!'
                })
            }

            if (res.locals.settings) {
                return res.json({
                    success: true,
                    message: 'Successfully'
                })
            }

            new settingModel({
                nameSite, defaultTitle, description, keywords, favicon, thumbnail, gameNote, limitPhone, paymentComment, withdrawComment, missionData, topData, history, refund, notification, siteStatus
            }).save()
                .then((data) => {
                    return res.json({
                        success: true,
                        message: 'Successfully'
                    })
                }).catch((err) => {
                    return res.json({
                        success: false,
                        message: 'Có lỗi xảy ra ' + err
                    })
                })

        } catch (err) {
            next(err);
        }
    },
    reset: async (req, res, next) => {
        try {
            let TOKEN_SETUP = req.params.TOKEN_SETUP;

            if (process.env.TOKEN_SETUP != TOKEN_SETUP) {
                return res.json({
                    success: false,
                    message: 'Invaild Token Setup!'
                })
            }

            let games = await gameModel.findOne();
            let rewards = await rewardModel.findOne();
            let users = await userModel.findOne();
            let settings = await settingModel.findOne();
            if (!games || !rewards || !users || !settings) {
                await gameModel.deleteMany();
                await rewardModel.deleteMany();
                await userModel.deleteMany();
                await settingModel.deleteMany();
                return res.redirect('../install');
            }

            res.json({
                success: false,
                message: 'Unable to reset settings!'
            })
        } catch (err) {
            next(err);
        }
    }
}

module.exports = installController;