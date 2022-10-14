"use strict";
const axios = require("axios");

module.exports = {
    sendText: async (token, chatID, message) => {
        try {
            let options = {
                method: 'POST',
                url: `https://api.telegram.org/bot${token}/sendMessage`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: `chat_id=${chatID}&text=${message}`
            };

            let { data: response } = await axios(options);

            return response.ok ? ({
                success: true,
                message: 'Gửi thành công!'
            }) : ({
                success: false,
                message: 'Gửi thất bại!'
            })
        } catch (err) {
            return ({
                success: false,
                message: 'Có lỗi xảy ra, ' + err.message || err
            })
        }
    },
    
}