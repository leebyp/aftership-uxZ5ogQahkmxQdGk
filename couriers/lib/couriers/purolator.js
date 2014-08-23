/*
	Purolator crawler class
*/

(function () {

	var _abstract = require('../abstract_courier');
	var _util = require('util');
	
	var Utility = require('../utility');
	var Checkpoint = require('../models/checkpoint');
	var GeneralError = require('../models/general_error');

	// config
	var config = {
		number_of_token_per_job: 1,
		slug: 'purolator',
		url: 'https://www.purolator.com/purolator/ship-track/tracking-details.page?pin='
	};

	/**
	 * @constructor
	 */
	function Purolator() {
		this.config = config;
		Purolator.super_.apply(this, arguments);
	}

	_util.inherits(Purolator, _abstract);

	module.exports = Purolator;
});