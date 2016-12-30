const express = require('express');
const router = express.Router();
const debug = require('debug')('sw-time-sheet:routes:app');

const TimeSheet = require('../models/time_sheet');
const _U = require('underscore');
const moment = require('moment');

router.get('/', function (req, res, next) {
    res.locals.dateTime = moment().format('MMMM Do YYYY, h:mm:ss a');
    res.locals.timeIn = _U.isUndefined(req.session.timeIn) ? null : moment(req.session.timeIn).format('MMMM Do YYYY, h:mm:ss a');
    //debug('usr',req.user);
    res.render('app');
});

router.post('/startShift', function (req, res, next) {
    res.locals.dateTime = new Date();

    req.session.timeIn = new Date();

    TimeSheet.startShift({
        userId: req.user._id,
        timeIn: req.session.timeIn
    }, function (err, account) {
        if (err) {
            return res.render('app', {account: account});
        }

        res.redirect('/app');
    });

});

module.exports = router;
