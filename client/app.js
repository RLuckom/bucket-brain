const request = require('browser-request');
const schemaFactory = require('../schema/schema').schemaFactory;
const apiFactory = require('../node_modules/water-shape/src/api/request-adapter');
const appFactory = require('./appFactory.js');
const _ = require('lodash');
const async = require('async');

appFactory(apiFactory(schemaFactory(), window.location.href + 'api', request, _, async));
