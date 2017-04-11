const express = require('express');
const router = express.Router();
const debug = require('debug')('sw-time-sheet:routes:list');

const TimeSheet = require('../models/time_sheet');
const appUtils = require('../lib/utils');
const _U = require('underscore');
const moment = require('moment');
const TimeDisplayFormat = 'D MMMM YYYY, HH:mm';

function buildBaseUrl(req, res, next) {
    res.locals.baseUrl = req.originalUrl.split("?").shift();
    next();
}

function buildWeeklyHeaders(req, res, next) {
    if (!_U.isUndefined(req.query.week_start)) {
        res.locals.weekStart = moment(req.query.week_start).startOf('isoweek').subtract(7, 'days').toISOString();
        req.queryTime = moment(req.query.week_start).startOf('isoweek');
    } else {
        res.locals.weekStart = moment().startOf('isoweek').subtract(7, 'days').toISOString();
        req.queryTime = moment().startOf('isoweek');
    }

    if (!req.queryTime.clone().isAfter(moment().startOf('isoweek')) && !req.queryTime.clone().isSame(moment().startOf('isoweek'))) {
        res.locals.nextWeek = req.queryTime.clone().add(7, 'days').toISOString();
    }

    res.locals.weekEndDisplay = req.queryTime.clone().add(6, 'days').format(TimeDisplayFormat);

    next();
}

router.get('/', buildBaseUrl, buildWeeklyHeaders, function (req, res, next) {

    res.locals.dateTime = moment().tz(req.session.userTimeZone).format(TimeDisplayFormat);
    res.locals.userTimeZone = req.session.userTimeZone;

    // debug('now',req.queryTime.clone().toDate());

    TimeSheet
        .find({
            userId: req.user._id,
            timeIn: {
                $gt: req.queryTime.clone().toDate(), $lt: req.queryTime.clone().endOf('isoweek').toDate()
            }
        })
        .select({
            timeIn: 1,
            timeOut: 1,
            breakEnd: 1,
            breakStart: 1
        })
        .sort({timeIn: -1})
        .exec(function (err, data) {

            res.locals.totalHoursWorked = 0;

            res.locals.data = _U.map(data, function (d) {

                //debug('punchSheet', d);

                let returnData = {
                    date: moment(d.timeIn).format(TimeDisplayFormat),
                    timeIn: moment(d.timeIn).tz(req.session.userTimeZone).format(TimeDisplayFormat)
                };

                if (!_U.isUndefined(d.timeOut)) {
                    returnData.timeOut = moment(d.timeOut).tz(req.session.userTimeZone).format(TimeDisplayFormat);

                    let totalLoggedIn = moment(d.timeOut).diff(moment(d.timeIn), 'minutes');
                    //debug('totalLoggedIn', totalLoggedIn);

                    let totalBreakHours = 0;

                    if (!_U.isUndefined(d.breakStart)) {
                        let maxLength = d.breakStart.length;
                        if (maxLength > d.breakEnd.length) {
                            maxLength = d.breakEnd.length;
                        }

                        for (let i = 0; i < maxLength; i++) {
                            totalBreakHours += moment(d.breakEnd[i]).diff(moment(d.breakStart[i]), 'minutes');
                        }
                    }

                    //debug('totalBreakHours', totalBreakHours);

                    returnData.workedHours = appUtils.humaniseTime(totalLoggedIn - totalBreakHours);
                    returnData.breakHours = appUtils.humaniseTime(totalBreakHours);
                    res.locals.totalHoursWorked += totalLoggedIn - totalBreakHours;
                }


                return returnData;
            });

            res.locals.totalHoursWorked = appUtils.humaniseTime(res.locals.totalHoursWorked);

            res.render('list');
        });

});

module.exports = router;
