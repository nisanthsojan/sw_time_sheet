const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieSecret = 'somerandomsecretforcookieswithnumberslike4196andf';
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');
const _U = require('underscore');
const MongoStore = require('connect-mongo')(session);
const ensureLogin = require('connect-ensure-login');

const debug = require('debug')('sw-time-sheet:app');

const app = express();

// mongoose
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sw_time_sheet');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.set('layout', 'layout');
app.engine('html', require('hogan-express'));

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser(cookieSecret));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: cookieSecret,
    resave: false,
    saveUninitialized: true,
    //cookie: {secure: true},
    store: new MongoStore({mongooseConnection: mongoose.connection})
}));

app.use(passport.initialize());
app.use(flash());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.title = 'SW Time Sheet';
    res.locals.user = _U.isUndefined(req.user) ? null : req.user;
    next();
});

// passport config
const Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

let routes = {};

routes.index = require('./routes/index');
routes.app = require('./routes/app');

app.use('/app', ensureLogin.ensureLoggedIn(), routes.app);
app.get('/logout', function (req, res) {
    req.logout();
    req.session.destroy();
    res.redirect('/');
});
app.get('/ping', function (req, res) {
    res.status(200).send("pong!");
});
app.use('/', ensureLogin.ensureNotLoggedIn({redirectTo: '/app'}), routes.index);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
