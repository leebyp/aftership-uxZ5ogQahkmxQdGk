/**
 * Teddy 2014-08-08
 * USPS couriers API
 * Muse use Revision 1 for the api call, so that can have much more detail result. such as shipping type.
 */
(function() {
	'use strict';

	var USPS_HOST = 'http://production.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=',
		USER_ID = '284AKQA06671';

	var _abstract = require('../abstract_courier'),
		_util = require('util'),
		_ = require('lodash'),
		courier_country = require('courier-country'),
		GeneralError = require('../models/general_error'),
		Utility = require('../utility'),
		Checkpoint = require('../models/checkpoint');

	/**
	 *
	 * @param tracking_numbers - {array}
	 * @constructor
	 */

	// config
	var config = {
		slug: 'usps',
		number_of_trackings_per_job: 35, // max 35
		number_of_token_per_job: 1
	};

	function Usps() {
		this.config = config;
		Usps.super_.apply(this, arguments);
	}

	_util.inherits(Usps, _abstract);

	function _formatCheckpointDateString(event_date, event_time) {
		if (event_date && event_time) {
			return [event_date + ' ' + event_time, 'YYYY-MM-DD HH:mm'];
		} else {
			if (event_date) {
				return [event_date, 'YYYY-MM-DD'];
			} else {
				if (event_time) {
					return [event_time, 'HH:mm'];
				} else {
					return [];
				}
			}
		}
	}

	Usps.prototype.createRequest = function(trackings, callback) {
		console.log(Utility.Timer.micro() + ': ' + this.config.slug + ' createRequest');

		var xml = '<TrackFieldRequest USERID="' + USER_ID + '">' +
			'<Revision>1</Revision>' +
			'<ClientIp>127.0.0.1</ClientIp>' +
			'<SourceId>XYZ Corp</SourceId>';

		for (var i = 0; i < trackings.length; i++) {
			xml += '<TrackID ID="' + trackings[i].getTrackingNumber() + '"></TrackID>';
		}
		xml += '</TrackFieldRequest >';

		var headers = {
			'Host': 'production.shippingapis.com',
			'Accept-Language': 'en-us',
			'User-Agent': 'USPS-Mobile/337 CFNetwork/609.1.4 Darwin/13.0.0'
		};

		var params = {
			url: USPS_HOST + xml,
			headers: headers,
			method: 'POST'
		};

		callback(null, params);
	};

	Usps.prototype.beforeParse = function(trackings, cleaned_body, callback) {
		console.log(Utility.Timer.micro() + ': ' + this.config.slug + ' beforeParse');

		var json_object = Utility.Converter.xml2Object(cleaned_body);

		var mapped_trackings = {};

		if (_.isUndefined(json_object.TrackResponse)) {
			callback(new GeneralError(501, 'Invalid TrackResponse'), mapped_trackings);
		} else {
			if (_.isUndefined(json_object.TrackResponse.TrackInfo)) {
				callback(new GeneralError(502, 'Invalid TrackResponse.TrackInfo'), mapped_trackings);
			} else {
				var track_info = [];

				if (_.isArray(json_object.TrackResponse.TrackInfo)) {
					track_info = json_object.TrackResponse.TrackInfo;
				} else {
					track_info.push(json_object.TrackResponse.TrackInfo);
				}

				for (var i = 0; i < track_info.length; i++) {
					mapped_trackings[track_info[i].ID] = track_info[i];
				}

				callback(null, mapped_trackings);

			}
		}
	};

	Usps.prototype.parse = function(trackings, mapped_trackings, callback) {
		var _this = this,
			mapped_tracking, // one tracking result
			checkpionts,
			checkpoint,
			shipment,
			origin_address,
			destination_address,
			iso3,
			i,
			j,
			checkpoint_date_string;

		console.log(Utility.Timer.micro() + ': ' + this.config.slug + ' parse');

		for (i = 0; i < trackings.length; i++) {
			// start wiki step 7
			checkpionts = [];

			mapped_tracking = mapped_trackings[trackings[i].getTrackingNumber()];
			shipment = trackings[i].getShipment();
			origin_address = trackings[i].getOriginAddress();
			destination_address = trackings[i].getDestinationAddress();

			if (mapped_tracking.Error) {
				trackings[i].setError(new GeneralError(800, mapped_tracking.Error.Description));
			} else {
				if (mapped_tracking.Class) {
					shipment.setType(mapped_tracking.Class);
				}

				if (mapped_tracking.ExpectedDeliveryDate) {
					if (mapped_tracking.ExpectedDeliveryTime) {
						shipment.setScheduledDeliveryDateString(mapped_tracking.ExpectedDeliveryDate + ' ' + mapped_tracking.ExpectedDeliveryTime);
					} else {
						shipment.setScheduledDeliveryDateString(mapped_tracking.ExpectedDeliveryDate);
					}
				}

				if (mapped_tracking.GuaranteedDeliveryDate) {
					if (mapped_tracking.GuaranteedDeliveryTime) {
						shipment.setScheduledDeliveryDateString(mapped_tracking.GuaranteedDeliveryDate + ' ' + mapped_tracking.GuaranteedDeliveryTime);
					} else {
						shipment.setScheduledDeliveryDateString(mapped_tracking.GuaranteedDeliveryDate);
					}
				}

				if (mapped_tracking.OriginZip) {
					origin_address.setZip(mapped_tracking.OriginZip);
				}
				if (mapped_tracking.OriginCity) {
					origin_address.setCity(mapped_tracking.OriginCity);
				}
				if (mapped_tracking.OriginState) {
					origin_address.setState(mapped_tracking.OriginState);
				}
				if (mapped_tracking.OriginCountryCode) {
					origin_address.setCountryIso3(mapped_tracking.OriginCountryCode);
				}

				if (mapped_tracking.DestinationZip) {
					destination_address.setZip(mapped_tracking.DestinationZip);
				}
				if (mapped_tracking.DestinationCity) {
					destination_address.setCity(mapped_tracking.DestinationCity);
				}
				if (mapped_tracking.DestinationState) {
					destination_address.setState(mapped_tracking.DestinationState);
				}
				if (mapped_tracking.DestinationCountryCode) {
					destination_address.setCountryIso3(mapped_tracking.DestinationCountryCode);
				}

				// check if insurance is included
				// e.g. '$50 insurance included'
				if (mapped_tracking.Service) {
					var found,
						services = [];
					if (_.isArray(mapped_tracking.Service)) {
						services = mapped_tracking.Service;
					} else {
						services.push(mapped_tracking.Service);
					}
					for (j = 0; j < services.length; j++) {
						found = services[j].match(/ insurance included/i);
						if (found) {
							shipment.setInsuredAmount(services[j].substring(1, found.index));
							if (services[j].substring(0, 1) === '$') {
								shipment.setInsuredCurrency('USD');
							}
							break;
						}
					}
				}

				// make checkpoints array: TrackDetail.reverse().value() + TrackSummary
				var this_tracking_checkpoints = [];

				if (mapped_tracking.TrackDetail) {
					if (_.isArray(mapped_tracking.TrackDetail)) {
						this_tracking_checkpoints = mapped_tracking.TrackDetail.reverse();
					} else {
						this_tracking_checkpoints.push(mapped_tracking.TrackDetail);
					}

				}

				if (mapped_tracking.TrackSummary) {
					this_tracking_checkpoints.push(mapped_tracking.TrackSummary);
				}

				for (j = 0; j < this_tracking_checkpoints.length; j++) {
					iso3 = courier_country(this_tracking_checkpoints[j].EventCity, _this.getSlug()).alpha3;

					checkpoint_date_string = _formatCheckpointDateString(this_tracking_checkpoints[j].EventDate, this_tracking_checkpoints[j].EventTime);

					checkpoint = new Checkpoint();
					checkpoint.setMessage(this_tracking_checkpoints[j].Event)
						.setCheckpointTimeString(checkpoint_date_string[0], checkpoint_date_string[1]);
					checkpoint.getAddress().setCountryIso3(iso3)
						.setState(this_tracking_checkpoints[j].EventState)
						.setCity(this_tracking_checkpoints[j].EventCity)
						.setZip(this_tracking_checkpoints[j].EventZIPCode);
					checkpionts.push(checkpoint);
				}

				trackings[i].setCheckpoints(checkpionts);
			}
		}

		callback(null, trackings);
	};


	// export the class
	module.exports = Usps;

})();
