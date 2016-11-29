'use strict';
const dbUtilsFactory = require('water-shape').persistence.sqlite3Adapter;
const startServer = require('water-shape').server.hapiAdapter.startServer;
const apiClientFactory = require('water-shape').api.requestAdapter;
const request = require('request');
const uuid = require('uuid');
const fs = require('fs');
const _ = require('lodash');
const async = require('async');
const sqlite3 = require('sqlite3');
const hapi = require('hapi');
const inert = require('inert');
const phantomPath = require('phantomjs-prebuilt').path;
const schema = require('../../../schema/schema').schemaFactory();
const webdriver = require('selenium-webdriver');
global.by = webdriver.By;

const logger = {
  log: (level, message) => {
    return console.log(`[ ${level} ] ${message}`);
  }
};

var dbUtils, server;

function setupTests(schema, callback) {
  logger.log('info', 'setting up');
  const api = apiClientFactory(schema, 'http://localhost:8080/api', request, _, async);
  var finished = {};
  function all(taskName) {
    finished[taskName] = false;
    return function() {
      logger.log('task', 'finished ' + taskName);
      finished[taskName] = true;
      if (_.every(finished)) {
        logger.log('success', 'setup complete');
        return callback(null, api);
      }
    };
  }
  try {
    logger.log('info', 'deleting test db');
    fs.unlinkSync(__dirname + '/test.db');
  } catch(err) {logger.log('unlink', err);} // don't care
  logger.log('info', 'creating db');
  dbUtilsFactory(__dirname + '/test.db', schema, logger, function(dbu) {
    logger.log('got db');
    dbUtils = dbu;
    var createTableCallback = all('createTables');
    var startServerCallback = all('startServer');
    dbUtils.createTablesAndDefaultValues(createTableCallback);
    server = startServer({port: 8080, distPath: __dirname + '/../../../dist'}, dbUtils, logger, startServerCallback, hapi, inert, _, uuid);
  }, _, async, sqlite3, uuid);
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

beforeEach(function(done) {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 400000;
  jasmine.getEnv().defaultTimeoutInterval = 400000; 

  var customPhantom = webdriver.Capabilities.phantomjs();
  customPhantom.set("phantomjs.binary.path", phantomPath);
  var customChrome = webdriver.Capabilities.chrome();
  global.driver = new webdriver.Builder()
    .withCapabilities(customPhantom)
    .build();
  setupTests(schema, function(err, res) {
    if (err) {
      throw err;
    }
    driver.get('http://localhost:8080').then(function() {
      driver.findElement({css: 'body'}).getText().then(function(t) {
        console.log('text', t);
        done();
      }, function(e) {
        console.log('error', e);
        done();
      });
    });
  });
});

afterEach(function(done) {
  teardownTests(schema, function(err, res) {
    if (err) {
      throw err;
    }
    driver.quit();;
    done();
  });
});
