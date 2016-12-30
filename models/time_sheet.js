const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _U = require('underscore');
const ObjectId = require('mongoose').Types.ObjectId;


let TimeSheetSchema = new Schema({
    userId: Schema.Types.ObjectId,
    timeIn: {type: Date},
    timeOut: {type: Date},
    breakStart: [{type: Date}],
    breakEnd: [{type: Date}],
});

let TimeSheet = mongoose.model('time_sheets', TimeSheetSchema);

TimeSheet.startShift = (params, cb) => {
    if (!_U.isObject(params) || !_U.has(params, 'userId') || !_U.has(params, 'timeIn')) {
        return cb('no parameters');
    }

    if (!ObjectId.isValid(params.userId)) {
        return cb('invalid object id');
    }

    if (!_U.isDate(params.timeIn)) {
        return cb('invalid timeIn');
    }

    let newTime = new TimeSheet({userId: params.userId, timeIn: params.timeIn});
    newTime.save(function (err) {
        // we've saved the dog into the db here
        if (err) {
            return cb('unable to save');
        }

        return cb(null, newTime);
    });
};



module.exports = TimeSheet;