"use strict";
const Pusher = require("pusher");

exports.trigger = (event, data) => {
    const pusher = new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_APP_KEY,
        secret: process.env.PUSHER_APP_SECRET,
        cluster: "ap1",
        useTLS: true
    });
    pusher.trigger('appPusher', event, data);
}

