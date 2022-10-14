const historyHelper = require('../helpers/history.helper');
const userModel = require('../models/user.model');

const cronController = {
    getHistory: async (req, res, next) => {
        try {
            let { token } = req.params;

            if (!await userModel.findOne({ token })) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed!'
                })
            }

            var startTime = performance.now();

            let data = await historyHelper.runHistory();

            var endTime = performance.now()
            console.log(`Done, ${Math.round((endTime - startTime) / 1000)}s`);

            res.status(200).json({
                success: true,
                message: 'Lấy thành công',
                data
            })

        } catch (err) {
            next(err);
        }
    },
    reward: async (req, res, next) => {
        try {
            let { token } = req.params;

            if (!await userModel.findOne({ token })) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed!'
                })
            }

            var startTime = performance.now();

            let data = await historyHelper.runReward();

            var endTime = performance.now()
            console.log(`Done, ${Math.round((endTime - startTime) / 1000)}s`);

            res.status(200).json({
                success: true,
                message: 'Lấy thành công',
                data
            })

        } catch (err) {
            next(err);
        }
    },
    refund: async (req, res, next) => {
        try {
            let { token } = req.params;

            if (!await userModel.findOne({ token })) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed!'
                })
            }

            var startTime = performance.now();

            let error = ['errorComment', 'limitBet'];
            let data = await historyHelper.runError(error);

            var endTime = performance.now()
            console.log(`Done, ${Math.round((endTime - startTime) / 1000)}s`);

            res.status(200).json({
                success: true,
                message: 'Hoàn tiền thành công!',
                data
            })

        } catch (err) {
            next(err);
        }
    },
    rewardID: async (req, res, next) => {
        try {
            let { token, transId } = req.params;

            if (!await userModel.findOne({ token })) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed!'
                })
            }

            var startTime = performance.now();

            let data = await historyHelper.rewardTransId(null, transId);

            var endTime = performance.now()
            console.log(`Done, ${Math.round((endTime - startTime) / 1000)}s`);

            res.status(200).json({
                success: true,
                message: 'Trả thưởng thành công!',
                data
            })

        } catch (err) {
            next(err);
        }
    },
    rewardError: async (req, res, next) => {
        try {
            let { token } = req.params;

            if (!await userModel.findOne({ token })) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed!'
                })
            }

            var startTime = performance.now();

            let error = ['errorPhone', 'limitPhone', 'errorMoney'];
            let data = await historyHelper.runError(error);

            var endTime = performance.now()
            console.log(`Done, ${Math.round((endTime - startTime) / 1000)}s`);

            res.status(200).json({
                success: true,
                message: 'Trả thưởng thành công!',
                data
            })

        } catch (err) {
            next(err);
        }
    },
    rewardTOP: async (req, res, next) => {
        try {
            let { token } = req.params;

            if (!await userModel.findOne({ token })) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed!'
                })
            }

            var startTime = performance.now();

            let data = await historyHelper.rewardTOP();

            var endTime = performance.now()
            console.log(`Done, ${Math.round((endTime - startTime) / 1000)}s`);

            res.status(200).json({
                success: true,
                message: !data ? 'Trả thưởng top thất bại!' : 'Trả thưởng top thành công!',
            })

        } catch (err) {
            next(err);
        }
    }
}

module.exports = cronController;