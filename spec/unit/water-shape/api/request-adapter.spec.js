'use strict';
const dbUtilsFactory = require('../../../../water-shape/persistence/sqlite3-adapter');
const startServer = require('../../../../water-shape/server/hapi-adapter').startServer;
const apiClientFactory = require('../../../../water-shape/api/request-adapter');
const testGenericDataManipulationInterface = require('../dataManipulationInterfaceTest');
const request = require('request');
const uuid = require('uuid');
const fs = require('fs');
const _ = require('lodash');

const logger = {
  log: (level, message) => {
    return console.log(`[ ${level} ] ${message}`);
  }
};

describe('api tests', function() {

  var dbUtils, server;
  function setupTests(schema, callback) {
    const api = apiClientFactory(schema, 'http://localhost:8080/api', request);
    var finished = {};
    function all(taskName) {
      finished[taskName] = false;
      return function() {
        finished[taskName] = true;
        if (_.every(finished)) {
          return callback(null, api);
        }
      };
    }
    try {
      fs.unlinkSync(__dirname + '/test.db');
    } catch(err) {logger.log('unlink', err);} // don't care
    dbUtilsFactory(__dirname + '/test.db', schema, logger, function(dbu) {
      dbUtils = dbu;
      var createTableCallback = all('createTables');
      var startServerCallback = all('startServer');
      dbUtils.createTablesAndDefaultValues(createTableCallback);
      server = startServer(dbUtils, logger, startServerCallback);
    });
  };

  function teardownTests(dmi, callback) {
    var finished = {};
    function all(taskName) {
      finished[taskName] = false;
      return function() {
        finished[taskName] = true;
        if (_.every(finished)) {
          return callback();
        }
      };
    }
    try {
      fs.unlinkSync(__dirname + '/test.db');
    } catch(err) {logger.log('unlink', err);} // don't care
    var closeDbCallback = all('closeDb');
    var stopServerCallback = all('stopServer');
    dbUtils.close(closeDbCallback);
    server.stop(stopServerCallback);
  };

  testGenericDataManipulationInterface('api', setupTests, teardownTests);

  describe('nongeneric tests', function() {
    const schema = require('../../../../schema/schema').schemaFactory();
    const api = apiClientFactory(schema, 'http://localhost:8080/api', request);
    beforeEach(function(done) {
      var finished = {};
      function all(taskName) {
        finished[taskName] = false;
        return function() {
          finished[taskName] = true;
          if (_.every(finished)) {
            return done();
          }
        };
      }
      try {
        fs.unlinkSync(__dirname + '/test.db');
      } catch(err) {logger.log('unlink', err);} // don't care
      dbUtilsFactory(__dirname + '/test.db', schema, logger, function(dbu) {
        dbUtils = dbu;
        var createTableCallback = all('createTables');
        var startServerCallback = all('startServer');
        dbUtils.createTablesAndDefaultValues(createTableCallback);
        server = startServer(dbUtils, logger, startServerCallback);
      });
    });

    afterEach(function(done) {
      var finished = {};
      function all(taskName) {
        finished[taskName] = false;
        return function() {
          finished[taskName] = true;
          if (_.every(finished)) {
            return done();
          }
        };
      }
      try {
        fs.unlinkSync(__dirname + '/test.db');
      } catch(err) {logger.log('unlink', err);} // don't care
      var closeDbCallback = all('closeDb');
      var stopServerCallback = all('stopServer');
      dbUtils.close(closeDbCallback);
      server.stop(stopServerCallback);
    });

    function compareIgnoreId(a, b) {
      var aNew = _.cloneDeep(a);
      var bNew = _.cloneDeep(b);
      delete aNew.uid;
      delete bNew.uid;
      return _.isEqual(aNew, bNew);
    }

    function allEqualWithoutId(aList, bList) {
      return _.every(_.zip(aList, bList), (pair) => {
        return compareIgnoreId(pair[0], pair[1]);
      });
    }

    it('serves the API', function(done) {
      request({
        method: 'GET',
        url: 'http://localhost:8080/api/sequenceTypes',
        json: true
      }, function(e, r, b) {
        expect(allEqualWithoutId(b, schema.sequenceTypes.initialValues)).toBe(true);
        done();
      });
    });

    it('api can get a list of predefined values', function(done) {
      api.sequenceTypes.get(function(e, r, b) {
        expect(allEqualWithoutId(b, schema.sequenceTypes.initialValues)).toBe(true);
        done();
      });
    });

    it('api can post a sequence, get it, then delete it', function(done) {
      const sequenceToAdd = {
        uid: uuid.v4(),
        dateCreated: new Date().toString(),
        name: 'newSequence',
        sequenceType: 'DURATION',
        defaultState: 1
      };
      api.sequences.get(function(e, r, b) {
        expect(e).toBeNull();
        expect(b).toEqual([]);
        api.sequences.post(sequenceToAdd, function(e, r, b) {
          expect(e).toBeNull();
          expect(b).toEqual(sequenceToAdd);
          api.sequences.get(function(e, r, b) {
            expect(e).toBeNull();
            expect(b).toEqual([sequenceToAdd]);
            api.sequences.delete(sequenceToAdd, function(e, r, b) {
              expect(e).toBeNull();
              expect(b).toBeUndefined();
              api.sequences.get(function(e, r, b) {
                expect(e).toBeNull();
                expect(b).toEqual([]);
                done();
              });
            });
          });
        });
      });
    });
  });
});