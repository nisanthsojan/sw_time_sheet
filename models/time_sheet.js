const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const _U = require('underscore');
const ObjectId = require('mongoose').Types.ObjectId;

const debug = require('debug')('sw-time-sheet:models:time_sheet');


let TimeSheetSchema = new Schema({
    userId: Schema.Types.ObjectId,
    timeIn: {type: Date},
    timeOut: {type: Date},
    breakStart: [{type: Date}],
    breakEnd: [{type: Date}],
});

TimeSheetSchema.methods.endShift = function (timeOut, cb) {
    if (!_U.isDate(timeOut)) {
        return cb('invalid timeOut');
    }

    this.timeOut = timeOut;
    this.save();

    return cb(null, this);
};

TimeSheetSchema.statics.startShift = function (params, cb) {
    if (!_U.isObject(params) || !_U.has(params, 'userId') || !_U.has(params, 'timeIn')) {
        return cb('no parameters');
    }

    if (!ObjectId.isValid(params.userId)) {
        return cb('invalid object id');
    }

    if (!_U.isDate(params.timeIn)) {
        return cb('invalid timeIn');
    }

    let newTime = new this();
    newTime.userId = params.userId;
    newTime.timeIn = params.timeIn;
    newTime.save(cb);
};


module.exports = mongoose.model('TimeSheet', TimeSheetSchema);