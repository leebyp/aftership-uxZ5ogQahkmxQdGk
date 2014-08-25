/*
  Estes crawler class
*/

(function () {
  'use strict';

  var _abstract = require('../abstract_courier');
  var _util = require('util');
  
  var Utility = require('../utility');
  var Checkpoint = require('../models/checkpoint');
  var GeneralError = require('../models/general_error');

  // config
  var config = {
    number_of_token_per_job: 1,
    slug: 'estes',
    url: ''
  };

  /**
   * @constructor
   */
  function Estes() {
    this.config = config;
    Estes.super_.apply(this, arguments);
  }

  _util.inherits(Estes, _abstract);

  module.exports = Estes;
})();