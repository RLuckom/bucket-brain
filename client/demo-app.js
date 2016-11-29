const schemaFactory = require('../schema/schema').schemaFactory;
const apiFactory = require('water-shape').demoAdapter;
const appFactory = require('./appFactory.js');
const _ = require('lodash');
const async = require('async');
const uuid = require('uuid');

appFactory(apiFactory(schemaFactory(), _, async, uuid));
