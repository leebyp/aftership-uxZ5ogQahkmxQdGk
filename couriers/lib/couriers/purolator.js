/*
	Purolator crawler class
*/

(function () {

	var _abstract = require('../abstract_courier');
	var _util = require('util');
	
	var Utility = require('../utility');
	var Checkpoint = require('../models/checkpoint');
	var GeneralError = require('../models/general_error');

	var Cheerio = require('cheerio');

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

	Purolator.prototype.createRequest = function(trackings, callback) {
		console.log(Utility.Timer.micro() + ': ' + this.config.slug + ' createRequest');

		var params = {
			method: 'get',
			url: config.url + trackings[0].getTrackingNumber(),
			headers: {
				'User-Agent': Utility.Random.userAgent()
			}
		};

		callback(null, params);
	};

	Purolator.prototype.beforeParse = function(trackings, response_body, callback) {
		console.log(Utility.Timer.micro() + ': ' + this.config.slug + ' beforeParse');
		
		var results = {};
		results[trackings[0].getTrackingNumber()] = response_body;
		callback(null, results);
	};

	Purolator.prototype.parse = function(trackings, results, callback) {
		console.log(Utility.Timer.micro() + ': ' + this.config.slug + ' parse');

		for (var i=0; i<trackings.length; i++) {
			var checkpoints = [];
			var data = results[trackings[i].getTrackingNumber()];
			var $ = Cheerio.load(data);

			console.log($.html());
		}
	};

	module.exports = Purolator;
});