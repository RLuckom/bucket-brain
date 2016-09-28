'use strict';
const React = require('react');
const _ = require('lodash');
const Editable = require('../forms/editable.js');

function SequenceItemRowFactory(api) {
  return React.createClass({
    getInitialState: function() {
      return {editing: false};
    },
    render: function() {
      const sequenceItem = this.props.sequenceItem;
      const sequenceType = this.props.sequenceType;
      if (sequenceType === 'DURATION') {
        return this.renderDurationSequenceItemOrEdit(sequenceItem);
      } else {
        return this.renderTimeSequenceItemOrEdit(sequenceItem);
      }
    },
    refreshAndCallback: function(callback) {
      var self = this;
      return function(err, response) {
        if (err) {
          return callback(err);
        } else {
          return self.props.update(callback);
        }
      }
    },
    renderDurationSequenceItemOrEdit: function(sequenceItem) {
      var self = this;
      var durationOptions = {
        type: 'NUMBER',
        inputClass: 'sequence-item-table-cell-input',
        outerClass: 'sequence-item-table-cell',
        label: '',
        current: {displayValue: sequenceItem.durationSeconds},
        update: function(val, callback) {
          api.sequenceItem.save(_.merge(sequenceItem, {durationSeconds: val}), self.refreshAndCallback(callback));
        },
      };
      var stateOptions = {
        type: 'NUMBER',
        inputClass: 'sequence-item-table-cell-input',
        outerClass: 'sequence-item-table-cell',
        label: '',
        current: {displayValue: sequenceItem.state},
        update: function(val, callback) {
          api.sequenceItem.save(_.merge(sequenceItem, {state: val}), self.refreshAndCallback(callback));
        }
      };
      return (
        <tr className="sequenceItem">
          <td><Editable.EditableValue opts={durationOptions}></Editable.EditableValue></td>
          <td><Editable.EditableValue opts={stateOptions}></Editable.EditableValue></td>
        </tr>
      );
    },
    renderTimeSequenceItemOrEdit: function(sequenceItem) {
      var self = this;
      var startTimeOptions = {
        type: 'TEXT',
        inputClass: 'sequence-item-table-cell-input',
        outerClass: 'sequence-item-table-cell',
        label: '',
        current: {displayValue: sequenceItem.startTime},
        update: function(val, callback) {
          api.sequenceItem.save(_.merge(sequenceItem, {startTime: val}), self.refreshAndCallback(callback));
        }
      };
      var endTimeOptions = {
        type: 'TEXT',
        inputClass: 'sequence-item-table-cell-input',
        outerClass: 'sequence-item-table-cell',
        label: '',
        current: {displayValue: sequenceItem.endTime},
        update: function(val, callback) {
          api.sequenceItem.save(_.merge(sequenceItem, {endTime: val}), self.refreshAndCallback(callback));
        }
      };
      var stateOptions = {
        type: 'NUMBER',
        inputClass: 'sequence-item-table-cell-input',
        outerClass: 'sequence-item-table-cell',
        label: '',
        current: {displayValue: sequenceItem.state},
        update: function(val, callback) {
          api.sequenceItem.save(_.merge(sequenceItem, {state: val}), self.refreshAndCallback(callback));
        }
      };
      return (
        <tr className="sequenceItem">
          <td><Editable.EditableValue opts={startTimeOptions}></Editable.EditableValue></td>
          <td><Editable.EditableValue opts={endTimeOptions}></Editable.EditableValue></td>
          <td><Editable.EditableValue opts={stateOptions}></Editable.EditableValue></td>
        </tr>
      );
    }
  });
}

module.exports = SequenceItemRowFactory;
