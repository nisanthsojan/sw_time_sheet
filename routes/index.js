const express = require('express');
const passport = require('passport');
const Account = require('../models/account');
const router = express.Router();
const debug = require('debug')('sw-time-sheet:routes:index');

const moment = require('moment-timezone');


router.get('/', function (req, res, next) {
    res.render('index');
});

router.get('/register', function (req, res) {
    res.render('register');
});

router.post('/register', function (req, res) {

    if (req.body.password !== req.body.password2) {
        return res.render('register', {errorMessage: "password does not match"});
    }

    Account.register(new Account({username: req.body.username}), req.body.password, function (err, account) {
        if (err) {
            return res.render('register', {account: account});
        }

        passport.authenticate('local')(req, res, function () {
            res.redirect('/app');
        });
    });
});

router.get('/login', function (req, res) {
    res.render('login');
});

router.post('/login', function (req, res, next) {

    debug('moment',req.body.timezone);

    req.session.userTimeZone = req.body.timezone;
    next();
}, passport.authenticate('local', {
    successRedirect: '/app', // redirect to the secure profile section
    failureRedirect: '/login', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
}));

module.exports = router;