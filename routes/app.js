const express = require('express');
const router = express.Router();
const debug = require('debug')('sw-time-sheet:routes:app');

const TimeSheet = require('../models/time_sheet');
const _U = require('underscore');
const moment = require('moment');
const TimeDisplayFormat = 'Do MMMM YYYY, HH:mm';

function checkUserStarted(req, res, next) {

    TimeSheet.findOne({
        userId: req.user._id,
        timeIn: {$ne: null},
        timeOut: null
    }, function (err, ts) {
        if (err) {
            return res.redirect('/app');
        }

        if (!_U.isNull(ts)) {

            if (!_U.isEmpty(ts.breakStart)) {

                req.session.BreakStarted = true;

                if (!_U.isEmpty(ts.breakEnd)) {

                    if (ts.breakStart.length === ts.breakEnd.length) {
                        req.session.BreakStarted = false;
                    }

                }
            }

            req.session.TimeSheet = ts;
        }

        next();


    });


}

router.get('/', checkUserStarted, function (req, res, next) {
    let timeNow = moment();
    res.locals.dateTime = timeNow.format(TimeDisplayFormat);

    if (!_U.isUndefined(req.session.BreakStarted)) {
        res.locals.breakStarted = req.session.BreakStarted;
    }

    if (!_U.isUndefined(req.session.TimeSheet) && !_U.isNull(req.session.TimeSheet)) {

        let ts = req.session.TimeSheet;

        let timeIn = moment(ts.timeIn);
        res.locals.timeIn = timeIn.format(TimeDisplayFormat);

        if (!_U.isEmpty(ts.breakStart)) {

            if (!_U.isEmpty(ts.breakEnd)) {

                res.locals.workedHours = timeNow.diff(timeIn, 'minutes');

                let maxLength = ts.breakStart.length;
                let breakHours = 0;

                if (!_U.isUndefined(req.session.BreakStarted) && req.session.BreakStarted === true) {
                    maxLength = ts.breakEnd.length;
                    res.locals.workedHours = moment(_U.last(ts.breakStart)).diff(timeIn, 'minutes');
                }

                for (let i = 0; i < maxLength; i++) {
                    breakHours += moment(ts.breakEnd[i]).diff(moment(ts.breakStart[i]), 'minutes');
                }

                res.locals.workedHours -= breakHours;

            } else {
                res.locals.workedHours = moment(_U.first(ts.breakStart)).diff(timeIn, 'minutes');
            }

        } else {
            res.locals.workedHours = timeNow.diff(timeIn, 'minutes');
        }
    }

    //debug('req.session.TimeSheet', req.session.TimeSheet);

    //debug('usr',req.user);


    res.locals.workedHours = (res.locals.workedHours / 60).toFixed(2); // converting minutes to hours
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

function checkTimeSheet(req, res, next) {
    if (_U.isUndefined(req.session.TimeSheet)) {
        return res.redirect('/app');
    }
    next();
}

router.post('/endShift', checkTimeSheet, function (req, res, next) {

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


router.post('/startBreak', checkTimeSheet, function (req, res, next) {

    TimeSheet.findById(req.session.TimeSheet._id, function (err, ts) {
        if (err) {
            return res.redirect('/app');
        }

        ts.breakStart.push(new Date());

        ts.save(function (err) {
            if (err) {
                return res.redirect('/app');
            }
            req.session.TimeSheet = ts;
            req.session.BreakStarted = true;
            res.redirect('/app');
        });


    });

});

router.post('/endBreak', checkTimeSheet, function (req, res, next) {

    TimeSheet.findById(req.session.TimeSheet._id, function (err, ts) {
        if (err) {
            return res.redirect('/app');
        }

        ts.breakEnd.push(new Date());

        ts.save(function (err) {
            if (err) {
                return res.redirect('/app');
            }
            req.session.TimeSheet = ts;
            req.session.BreakStarted = false;
            res.redirect('/app');
        });


    });

});

module.exports = router;
