const express = require('express');
const passport = require('passport');
const Account = require('../models/account');
const router = express.Router();


router.get('/', function (req, res, next) {
    res.render('index', {user: req.user});
});

router.get('/register', function (req, res) {
    res.render('register', {});
});

router.post('/register', function(req, res) {

    if(req.body.password !== req.body.password2){
        return res.render('register', { errorMessage : "password does not match" });
    }

    Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
        if (err) {
            return res.render('register', { account : account });
        }

        passport.authenticate('local')(req, res, function () {
            res.redirect('/');
        });
    });
});

router.get('/login', function(req, res) {
    res.render('login');
});

router.post('/login', passport.authenticate('local'), function(req, res) {
    res.redirect('/');
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

router.get('/ping', function(req, res){
    res.status(200).send("pong!");
});

module.exports = router;
