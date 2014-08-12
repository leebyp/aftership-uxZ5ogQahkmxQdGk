/**
 * Bossa
 *
 * Parcel force crawler class
 *
 */

(function() {
	'use strict';
	var Utility = require('../utility');

	var _abstract = require('../abstract_courier');
	var _util = require('util');

	var Checkpoint = require('../models/checkpoint');
	var GeneralError = require('../models/general_error');

	var Browser = require('zombie');
	var Cheerio = require('cheerio');

	// config
	var config = {
		number_of_token_per_job: 1,
		slug: 'parcel-force',
		url: 'http://www.parcelforce.com/track-trace'
	};

	/**
	 * @constructor
	 */
	function ParcelForce() {
		this.config = config;
		ParcelForce.super_.apply(this, arguments);
	}

	_util.inherits(ParcelForce, _abstract);


	ParcelForce.prototype.browser = function(trackings, callback) {

		var browser = new Browser({
			debug: true,
			loadCSS: false,
			runScripts: false,
			maxWait: 30000
		});

		var user_agent = Utility.Random.userAgent();

		browser
			.visit(this.config.url, {
				userAgent: user_agent
			})
			.then(function() {
				console.log('page 1 done: ' + browser.statusCode + ', start waiting');
				browser
					.wait()
					.then(function() {
						if (browser.success) {
							console.log('page 1 completed');
							browser
								.fill('#edit-parcel-tracking-number', trackings[0].getTrackingNumber())
								.pressButton('#edit-submit', function() {
									console.log('page 2 done: ' + browser.statusCode + ', start waiting');
									browser
										.wait()
										.then(function() {
											if (browser.success) {
												console.log('page 2 completed');
												//browser.viewInBrowser();

												var $ = Cheerio.load(browser.html());
												browser.close();

												var html = $('.track-trace-results').html();

												if (!html) {
													callback(new GeneralError(404, 'Went to page 2 but content error'), trackings);
												} else {
													callback(null, html);
												}
											} else {
												console.log('page 2 error: ' + browser.statusCode);
												console.log(browser.error);

												browser.close();
												callback(new GeneralError(404, 'Cannot go to parcel force page 2'), trackings);
											}

										})
										.fail(function(err) {
											browser.close();
											callback(new GeneralError(404, 'Cannot go to parcel force page 2 ' + err), trackings);
										});
								});
						} else {
							console.log('page 1 error: ' + browser.statusCode);
							//console.log(browser.error);
							//console.log(browser);
							browser.close();
							callback(new GeneralError(404, 'Cannot go to parcel force page 1'), trackings);
						}
					})
					.fail(function(err) {
						browser.close();
						callback(new GeneralError(404, 'Cannot go to parcel forace page 1 ' + err), trackings);
					});
			})
			.fail(function(err) {
				browser.close();
				callback(new GeneralError(404), trackings);
			});
	};


	ParcelForce.prototype.createRequest = function(trackings, callback) {
		callback(null, {
			method: 'get',
			url: this.config.url,
			timeout: 30000,
			headers: {
				'User-Agent': Utility.Random.userAgent()
			}
		});
	};

	ParcelForce.prototype.beforeParse = function(trackings, response_body, callback) {
		var results = {};
		results[trackings[0].getTrackingNumber()] = response_body;
		callback(null, results);
	};

	ParcelForce.prototype.parse = function(trackings, results, callback) {
		console.log('parcel force parsing, trackings length: ' + trackings.length);

		var checkpoints = [];

		var parseCheckpointRow = function() {
			var tr = $(this);

			checkpoints.push(_buildCheckpoint(tr.find('.tracking-history-date').text(), tr.find('.tracking-history-time').text(), tr.find('.tracking-history-location').text(), tr.find('.tracking-history-desc').text()));

			//console.log(tr.html());
		};

		for (var i = 0; i < trackings.length; i++) {
			var tracking = trackings[i];

			checkpoints = [];

			//console.log(tracking.getDna());

			var data = results[tracking.getTrackingNumber()];

			var shipment_type = '';

			if (!tracking.getError()) {
				var $ = Cheerio.load(data);

				//console.log($.html());

				var tables = $('.tracking-history > table > tbody');

				tables.find('tr').each(parseCheckpointRow);

				//set shipment type
				shipment_type = $('.track-info').find('dt[class="service row"]').next().text();

			} else {
				console.log(tracking.getTrackingNumber() + ' tracking error: ' + tracking.getError());
			}

			checkpoints.reverse();

			tracking
				.setCheckpoints(checkpoints)
				.getShipment()
				.setType(shipment_type);
		}

		callback(null, trackings);
	};

	function _buildCheckpoint(date, time, location, message) {

		var checkpoint = new Checkpoint();
		checkpoint
			.setMessage(message)
			.setCheckpointTimeString(date + ' ' + time, 'DD/MM/YYYY HH:mm')
			.getAddress()
			.setStreetAddress(location);

		return checkpoint;
	}

	module.exports = ParcelForce;

})();