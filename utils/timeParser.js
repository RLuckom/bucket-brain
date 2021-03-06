const _ = require('lodash');
const moment = require('moment');
/* Parser for times of day without date information */

/*
 * @param {String} time : time string.
 * @returns {Object} : {hour: [0-24], minute: [0-60], second: [0-60]
 * @throws {Error} : if the time is not parseable
 */

var timeRegexWithSeconds =  /([0-9]{1,2}):([0-9]{2}):([0-9]{2}){0,1}(AM|PM|am|pm|Pm|Am|pM|aM){0,1}$/;
var timeRegexNoSeconds =  /([0-9]{1,2}):([0-9]{2})(AM|PM|am|pm|Pm|Am|pM|aM){0,1}$/;
function parseTime(t) {
  if (!t) {
    throw new Error('parseTime argument falsy');
  }
  if (_.isNumber(t.hour) && _.isNumber(t.minute) && _.isNumber(t.second)) {
    return t;
  }
  if (_.isDate(t)) {
    return {hour: t.getHours(), minute: t.getMinutes(), second: t.getSeconds()};
  }
  if (moment.isMoment(t)) {
    return {hour: t.hour(), minute: t.minute(), second: t.second()};
  }
  var withSeconds = t.match(timeRegexWithSeconds);
  var withoutSeconds = t.match(timeRegexNoSeconds);
  if (!withSeconds && !withoutSeconds) {
    throw new Error('Time format not recognized. A supported time format is 13:22:56 or 1:22:56PM');
  }
  var match = withSeconds ? withSeconds : [withoutSeconds[0], withoutSeconds[1], withoutSeconds[2], 0, withoutSeconds[3]];
  var hour = parseInt(match[1]);
  if (hour > 23) {
    throw new Error('Hour cannot be above 23');
  }
  if (hour === 0 && match[4]) {
    throw new Error('0 is not a valid hour when specifying AM or PM');
  }
  if (hour > 12 && match[4]) {
    throw new Error(`Hours greater than 12 are not valid when specifying AM or PM`);
  }
  if (match[4] && ['pm', 'PM', 'pM', 'Pm'].indexOf(match[4]) != -1) {
    hour += 12;
  }
  var minute = parseInt(match[2]);
  if (minute > 59) {
    throw new Error('Minute must be 0-59');
  }
  var second = match[3] ? parseInt(match[3]) : 0;
  if (second > 59) {
    throw new Error('Second must be 0-59');
  }
  return {hour: hour, minute: minute, second: second};
}

function toSeconds(time) {
  if (_.isNumber(time)) {
    return time;
  }
  time = parseTime(time);
  if (!_.isNumber(time.hour) || !_.isNumber(time.minute) || !_.isNumber(time.second)) {
    throw new Error(`Time does not have hour, minute, and second attributes ${time}`);
  }
  return (time.hour * 3600) + (time.minute * 60) + (time.second);
}

function dateToTimeObj(date) {
  return {hour: date.getHours(), minute: date.getMinutes(), second: date.getSeconds()};
}

function overlaps(period1, period2) {
  return (
    (period1.start > period2.start && period1.start < period2.end) ||
      (period1.end > period2.start && period1.end < period2.end) ||
      (period1.start < period2.start && period1.end >= period2.end) ||
      (period2.start < period1.start && period2.end >= period1.end) ||
      (period1.start <= period2.start && period1.end > period2.end) ||
      (period2.start <= period1.start && period2.end > period1.end) ||
      (period2.start === period1.start && period2.end === period1.end)
  );
}

function overlapsAny(period, periods) {
  return !!_.find(_.map(periods, _.partial(overlaps, period)));
}

function sequenceItemToTimePeriod(sequenceItem) {
  var tp ={start: toSeconds(sequenceItem.startTime), end: toSeconds(sequenceItem.endTime)};
  if (tp.start > tp.end) {
    throw new Error('sequenceItem startTime is after endTime');
  }
  return tp;
}

function sequenceItemOverlaps(sequenceItem, sequenceItems) {
  sequenceItems = _.filter(sequenceItems, function(s) {
    return s.startTime && s.endTime;
  });
  return overlapsAny(sequenceItemToTimePeriod(sequenceItem), _.map(sequenceItems, sequenceItemToTimePeriod));
}

function anySequenceItemOverlaps(sequenceItems) {
  var s;
  sequenceItems = _.cloneDeep(sequenceItems);
  while (sequenceItems.length > 1) {
    s = sequenceItems.pop();
    if (sequenceItemOverlaps(s, sequenceItems)) {
      return s;
    }
  }
  return false;
}

function secondsBetween(start, end) {
  end = moment(parseTime(end));
  start = moment(parseTime(start));
  if (end < start) {
    return (end.add(1, 'days') - start) / 1000;
  }
  return (end - start) / 1000;
}

function nearestBoundaryAfter(sequenceItems, t) {
  t = toSeconds(t);
  sequenceItems = orderByStartTime(sequenceItems);
  for (item of sequenceItems) {
    if (toSeconds(item.startTime) > t) {
      return {sequenceItem: null, boundary: item.startTime};
    } else if (toSeconds(item.endTime) > t) {
      return {sequenceItem: item, boundary: item.endTime};
    }
  }
  return {sequenceItem: null, boundary: sequenceItems[0].startTime};
}


function orderByStartTime(sequenceItems) {
  return _.orderBy(sequenceItems, function(s) {return !s.startTime ? 5000000 : toSeconds(s.startTime);});
}

function isWithin(sequenceItem, time) {
  return (
    toSeconds(sequenceItem.startTime) < toSeconds(time) &&
      toSeconds(sequenceItem.endTime) > toSeconds(time)
  ); 
}

module.exports = {
  isWithin: isWithin,
  parseTime: parseTime,
  sequenceItemOverlaps: sequenceItemOverlaps,
  anySequenceItemOverlaps: anySequenceItemOverlaps,
  orderByStartTime: orderByStartTime,
  nearestBoundaryAfter: nearestBoundaryAfter,
  secondsBetween: secondsBetween,
  toSeconds: toSeconds
};
