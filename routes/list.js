const express = require('express');
const router = express.Router();
const debug = require('debug')('sw-time-sheet:routes:list');

const TimeSheet = require('../models/time_sheet');
const _U = require('underscore');
const moment = require('moment');
const TimeDisplayFormat = 'Do MMMM YYYY, HH:mm';

router.get('/', function (req, res, next) {

    let timeNow = moment();
    res.locals.dateTime = timeNow.format(TimeDisplayFormat);

    TimeSheet
        .find({
            userId: req.user._id,
            timeIn: {
                $gt: moment().startOf('month').toDate(), $lt: moment().endOf('month').toDate()
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

            res.locals.data = _U.map(data, function (d) {

                //debug('punchSheet', d);

                let returnData = {
                    date: moment(d.timeIn).format('Do MMMM YYYY'),
                    timeIn: moment(d.timeIn).format(TimeDisplayFormat)
                };

                if (!_U.isUndefined(d.timeOut)) {
                    returnData.timeOut = moment(d.timeOut).format(TimeDisplayFormat);

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

                    returnData.workedHours = ((totalLoggedIn - totalBreakHours) / 60).toFixed(2);
                }

                return returnData;
            });

            res.render('list');
        });

});

module.exports = router;
