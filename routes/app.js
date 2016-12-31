const express = require('express');
const router = express.Router();
const debug = require('debug')('sw-time-sheet:routes:app');

const TimeSheet = require('../models/time_sheet');
const _U = require('underscore');
const moment = require('moment');

router.get('/', function (req, res, next) {
    let timeNow = moment();
    res.locals.dateTime = timeNow.format('MMMM Do YYYY, HH:mm:ss');
    if (!_U.isUndefined(req.session.TimeSheet) && !_U.isNull(req.session.TimeSheet)) {
        let timeIn = moment(req.session.timeIn);
        res.locals.timeIn = timeIn.format('MMMM Do YYYY, HH:mm:ss');
        res.locals.workedHours = timeNow.diff(timeIn, 'hours')
    }

    debug('req.session.TimeSheet', req.session.TimeSheet);

    //debug('usr',req.user);
    res.render('app');
});

router.post('/startShift', function (req, res, next) {

    TimeSheet.startShift({
        userId: req.user._id,
        timeIn: new Date()
    }, function (err, ts) {
        if (err) {
            return res.redirect('/app');
        }

        req.session.TimeSheet = ts;
        res.redirect('/app');
    });

});

router.post('/endShift', function (req, res, next) {

    if (_U.isUndefined(req.session.TimeSheet)) {
        return res.redirect('/app');
    }

    TimeSheet.findById(req.session.TimeSheet._id, function (err, ts) {
        if (err) {
            return res.redirect('/app');
        }

        ts.timeOut = new Date();
        ts.save(function (err) {
            if (err) {
                return res.redirect('/app');
            }
            req.session.TimeSheet = null;
            delete req.session.TimeSheet;
            res.redirect('/app');
        });


    });

});


router.post('/startBreak', function (req, res, next) {



});

module.exports = router;
