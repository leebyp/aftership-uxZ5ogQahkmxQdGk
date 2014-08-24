/*
	Purolator crawler class
*/

(function () {
	'use strict';

	var _abstract = require('../abstract_courier');
	var _util = require('util');
	
	var Utility = require('../utility');
	var Checkpoint = require('../models/checkpoint');
	var GeneralError = require('../models/general_error');

	var Cheerio = require('cheerio');
	var moment = require('moment');

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

		function _updateAddress(original, update_info) {
			if (update_info.country) {
				original.setCountryIso3(update_info.country);
			}
			if (update_info.province) {
				original.setState(update_info.province);
			}
			if (update_info.city) {
				original.setCity(update_info.city);
			}
			if (update_info.postalcode) {
				original.setZip(update_info.postalcode);
			}
			if (update_info.address) {
				original.setStreetAddress(update_info.address);
			}
			return original;
		}

		function _updateShipment(original, update_info) {
			if (update_info.product) {
				original.setType(update_info.product);
			}
			if (update_info.weight.estimated) {
				original.setWeight(update_info.weight.estimated);
			}
			if (update_info.weight.unit) {
				original.setWeightUnit(update_info.weight.unit.toLowerCase());
			}
			if (update_info.actualDelivery) {
				original.setDeliveredDate(moment.utc(update_info.actualDelivery, 'YYYY-MM-DDTHH:mm:ss'));
			}
			if (update_info.estimatedDelivery.deliverBy) {
				original.setScheduledDeliveryDateString(update_info.estimatedDelivery.deliverBy, 'YYYY-MM-DD HH:mm');
			}
			if (update_info.deliveryContact) {
				original.setSignedBy(update_info.deliveryContact);
			}
			return original;
		}

		for (var i=0; i<trackings.length; i++) {
			var tracking = trackings[i];

			var data = results[tracking.getTrackingNumber()];
			var $ = Cheerio.load(data);

			var shipment_info = $('#1359654114029').text();
			shipment_info = shipment_info.substr(0, shipment_info.length-205);

			// @NOTE: potentially dangerous eval statement
			var history, details, associated;
			eval(shipment_info +
				'\n history = jsHistoryTable' +
				'\n details = detailsData' +
				'\n associated = assocPackages');

			// update origin and destination addresses of tracking
			var updated_origin = _updateAddress(tracking.getOriginAddress(), details.origin);
			tracking.setOriginAddress(updated_origin);
			var updated_destination = _updateAddress(tracking.getDestinationAddress(), details.destination);
			tracking.setDestinationAddress(updated_destination);

			// update shipment info
			var updated_shipment = _updateShipment(tracking.getShipment(), details);
			tracking.setShipment(updated_shipment);

			// console.log('=================');
			// console.log(tracking);
			// console.log('=================');
			// console.log(history);
			// console.log('=================');
			// console.log(details);
			// console.log('=================');
			// console.log(associated);
			// console.log('=================');
		}

		callback(null, trackings);
	};

	module.exports = Purolator;
})();