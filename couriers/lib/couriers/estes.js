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

	var Browser = require('zombie');
	var Cheerio = require('cheerio');

	// config
	var config = {
		number_of_token_per_job: 1,
		slug: 'estes',
		url: 'http://www.estes-express.com/WebApp/ShipmentTracking/MainServlet'
	};

	/**
	 * @constructor
	 */
	function Estes() {
		this.config = config;
		Estes.super_.apply(this, arguments);
	}

	_util.inherits(Estes, _abstract);

	Estes.prototype.createRequest = function(trackings, callback) {
		console.log(Utility.Timer.micro() + ': ' + this.config.slug + ' createRequest');

		var tracking_ids = [];
		for (var i=0; i<trackings.length; i++) {
			tracking_ids.push(trackings[i].getTrackingNumber());
		}
		var search_criteria = tracking_ids.join('\r');

		var params = {
			method: 'post',
			url: config.url,
			headers: {
				'User-Agent': Utility.Random.userAgent()
			},
			form: {
				'submitFromForm': 'yes',
				'search_type': 'PRO',
				'search_criteria': search_criteria,
				'searchedType': 'PRO',
				'searchedCriteria': search_criteria
			}
		};

		callback(null, params);
	};

	module.exports = Estes;
})();