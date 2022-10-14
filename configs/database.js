const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        let conn = await mongoose.connect(process.env.MONGODB_URL)
        console.log(`Kết nối database thành công, host: ${conn.connection.host}`)
    } catch (err) {
        console.log(err)
    }
}

module.exports = { connectDB };