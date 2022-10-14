# TOKEN - TOKEN ACCOUNT ADMIN
* GET - domain/cronJobs/getHistory/:token
* GET - domain/cronJobs/reward/:token
* GET - domain/cronJobs/refund/:token
* GET - domain/cronJobs/rewardError/:token
* GET - domain/cronJobs/rewardId/:transId/:token
* GET - domain/cronJobs/rewardTOP/:token

# SETUP PUSHER
- PUSHER_APP_ID
- PUSHER_APP_KEY
- PUSHER_APP_SECRET

# SETUP BOT TELEGRAM
- TELEGRAM_TOKEN
- TELEGRAM_CHATID

# CONFIG MOMO
- appVer // 31170
- appCode // 3.1.17

# INSTALL SYSTEM - TOKEN SETUP IN TERMINAL
- domain/install

# RESET SYSTEM
- domain/reset/TOKEN_SETUP

# API MOMO
* POST - domain/api/v1/momo/otp -- BODY -- phone, password
* POST - domain/api/v1/momo/confirm -- BODY -- phone, otp
* POST - domain/api/v1/momo/login -- BODY -- phone
* POST - domain/api/v1/momo/history -- BODY -- phone, limit
* POST - domain/api/v1/momo/details -- BODY -- phone, transId
* POST - domain/api/v1/momo/balance -- BODY -- phone
* POST - domain/api/v1/momo/transfer -- BODY -- phone, receiver, amount, comment