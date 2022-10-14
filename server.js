const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { v4: uuidv4 } = require("uuid");
const session = require('express-session');
const db = require('./configs/database');
const missionDay = require('./libs/missionDay');
const { runCron, runMuster } = require('./libs/cronAuto');
const indexRoute = require('./router/index.route');
const errorHandler = require('./middleware/error.middleware');
const hbsHelper = require('./helpers/handlebars.helper');

app.engine('hbs', handlebars.engine({
    extname: '.hbs',
    partialsDir: path.join(__dirname, 'views/partials'),
    defaultLayout: false,
    helpers: hbsHelper
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', true)

dotenv.config({ path: path.join(__dirname, 'configs/config.env') });
app.use(cors())
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')))
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}))

if (process.env.NODE_ENV == 'development') {
    app.use(morgan('dev'))
}

// SET TOKEN SETUP
process.env.TOKEN_SETUP = uuidv4().toUpperCase();
console.log(`TOKEN SETUP: ${process.env.TOKEN_SETUP.toUpperCase()}`)

// Kết nối MongoDB
db.connectDB();

// Run CronJob
runCron();

// Run Muster
runMuster();

app.use(indexRoute);

// Error Handler
app.use(errorHandler);

app.listen(process.env.PORT, () => console.log(`Server đang hoạt động PORT: ${process.env.PORT}`));