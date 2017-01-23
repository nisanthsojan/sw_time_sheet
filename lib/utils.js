const moment = require('moment');

module.exports = {
    humaniseTime: (minutes) => {
        let workedDurationMoment = moment.duration(minutes, 'minutes');
        return Math.trunc(workedDurationMoment.asHours()) + ':' + workedDurationMoment.minutes();
    }
};