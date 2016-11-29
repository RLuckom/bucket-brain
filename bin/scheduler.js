const dmiFactory = require('water-shape').persistence.sqlite3Adapter;
const FILENAME = 'hydro.db';
const schema = require('../schema/schema.js').schemaFactory();
const logger = require('../utils/logger')( '/../logs/scheduler.log');
const schedulerFactory = require('../schedule/scheduler');
const hardwareManager = require('../schedule/hardwareManager');
const controllers = require('../schedule/livePeripheralTypeControlMethods')(logger);
const _ = require('lodash');
const async = require('async');
const sqlite3 = require('sqlite3');
const uuid = require('uuid');
const config = {
  RELOAD_SCHEDULE_SECONDS: 4
};

dmiFactory(FILENAME, schema, logger, function(dmi) {
  schedulerFactory(dmi, hardwareManager, controllers, config, logger).start();
}, _, async, sqlite3, uuid);
