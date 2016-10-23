const interruptible = require('../interruptible');
const uuid = require('uuid');
const timeParser = require('../../utils/timeParser')
const _ = require('lodash');

function filterSequenceItems(sequenceItems) {
  const filteredSequenceItems =  _.filter(sequenceItems, function(si) {
    try {
      timeParser.parseTime(si.startTime);
      timeParser.parseTime(si.endTime);
    } catch(err) {
      return false;
    }
    return !_.isUndefined(si.state);
  });
  if (timeParser.anySequenceItemOverlaps(filteredSequenceItems)) {
    throw new Error('Cannot start a time sequence with overlapping items');
  }
  return filteredSequenceItems;
}

function timeSequenceExecutor(controller, sequenceItems, defaultState) {
  const sequenceInterruptible = interruptible.interruptible(controller, defaultState);
  let peripheralTimeout;
  let currentInterrupt;
  sequenceItems = filterSequenceItems(sequenceItems);
  function executeSequenceItem() {
    const t = new Date();
    const boundary = timeParser.nearestBoundaryAfter(sequenceItems, t);
    const currentSequenceItem = boundary.sequenceItem;
    let previousInterrupt = currentInterrupt;
    if (currentSequenceItem) {
      currentInterrupt = {uid: uuid.v4(), state: currentSequenceItem.state};
      sequenceInterruptible.interrupt(currentInterrupt);
    } else {
      currentInterrupt = void(0);
    }
    if (previousInterrupt) {
      sequenceInterruptible.endInterrupt(previousInterrupt);
    }
    const secondsRemaining = timeParser.secondsBetween(t, boundary.boundary);
    peripheralTimeout = setTimeout(executeSequenceItem, secondsRemaining * 1000);
  }
  function endSchedule() {
    clearTimeout(peripheralTimeout);
    if (currentInterrupt) {
      sequenceInterruptible.endInterrupt(currentInterrupt);
    }
  }
  function replaceSequenceItems(newSequenceItems) {
    sequenceItems = filterSequenceItems(newSequenceItems);
    endSchedule();
    executeSequenceItem();
  }
  sequenceInterruptible.startSchedule = executeSequenceItem;
  sequenceInterruptible.replaceSequenceItems = replaceSequenceItems;
  sequenceInterruptible.endSchedule = endSchedule;
  return sequenceInterruptible;
}

module.exports = {
  timeSequenceExecutor,
  filterSequenceItems
};
