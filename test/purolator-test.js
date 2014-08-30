// write your test case here

var should = require('should');

var Couriers = require('../couriers/couriers');
var Trackings = require('../couriers/lib/models/trackings');
var Tracking = require('../couriers/lib/models/tracking');

describe('Courier test to track Purolator: ', function() {
  // override the default 2000ms timeout
  this.enableTimeouts(false);
  var courier = Couriers.getCourier('Purolator');

  describe('tracking number: 330218400340', function () {
    var trackings = new Trackings();
    trackings.push(new Tracking({
      tracking_number: '330218400340'
    }));

    it('should get trackings without error', function(done) {
      courier.getTrackings(trackings, function(err, trackings) {
        done();
      });
    });

    it('should update tracking origin address', function() {
      var origin = trackings[0].getOriginAddress();
      origin.getCountryIso3().should.eql('CA');
      origin.getState().should.eql('ON');
      origin.getCity().should.eql('Toronto');
      // origin.getZip().should.eql(null);
      origin.getStreetAddress().should.eql('');
      origin.getCoordinates().should.eql([]);
    });

    it('should update tracking destination address', function() {
      var destination = trackings[0].getDestinationAddress();
      destination.getCountryIso3().should.eql('CA');
      destination.getState().should.eql('SK');
      destination.getCity().should.eql('Saskatoon');
      // destination.getZip().should.eql(null);
      destination.getStreetAddress().should.eql('');
      destination.getCoordinates().should.eql([]);
    });

    it('should update tracking shipment details', function() {
      var shipment = trackings[0].getShipment();
      shipment.getType().should.eql('Purolator Express Envelope');
      shipment.getWeight().should.eql(1);
      shipment.getWeightUnit().should.eql('lb');
      shipment.getScheduledDeliveryDateString().should.eql('2014-08-08T09:11');
      shipment.getSignedBy().should.eql('ERLING');
    });

    it('should update tracking checkpoints details', function() {
      var checkpoints = trackings[0].getCheckpoints();
      checkpoints.length.should.eql(5);
      checkpoints[0].getMessage().should.eql('Shipping label created with reference(s): 2038495-2');
      checkpoints[0].getCheckpointTimeString().should.eql('2014-08-07T09:42:00');
    });

  });

});