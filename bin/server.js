'use strict';
const dbUtilsFactory = require('water-shape').persistence.sqlite3Adapter;
const logger = require('../utils/logger')( '/../logs/hydro.log');
const startServer = require('water-shape').server.hapiAdapter.startServer;
const _ = require('lodash');
const async = require('async');
const sqlite3 = require('sqlite3');
const uuid = require('uuid');
const hapi = require('hapi');
const inert = require('inert');

dbUtilsFactory(
  __dirname + '/../hydro.db',
  require('../schema/schema').schemaFactory(),
  logger,
  (dbUtils) => {
    return dbUtils.createTablesAndDefaultValues(
      function() {
        startServer(
          {port: 8080, distPath: __dirname + '/../dist'},
          dbUtils,
          logger,
          null,
          hapi,
          inert,
          _,
          uuid
        )
      });
  }, _, async, sqlite3, uuid);
