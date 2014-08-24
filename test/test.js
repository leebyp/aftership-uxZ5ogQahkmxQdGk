// write your test case here

var Couriers = require('../couriers/couriers');
var Trackings = require('../couriers/lib/models/trackings');
var Tracking = require('../couriers/lib/models/tracking');

describe('Dummy test to track Purolator: ', function() {
  // override the default 2000ms timeout
  this.timeout(0);

  it('#330218400340', function(done) {
    var courier = Couriers.getCourier('Purolator');
    var trackings = new Trackings();
    trackings.push(new Tracking({
      tracking_number: '330218400340'
    }));

    courier.getTrackings(trackings, function(err, trackings) {
      console.log('calling getTrackings final callback...');
      done();
    });
    
  });

});