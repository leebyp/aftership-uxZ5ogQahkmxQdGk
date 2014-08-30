// dummy estes test

var Couriers = require('../couriers/couriers');
var Trackings = require('../couriers/lib/models/trackings');
var Tracking = require('../couriers/lib/models/tracking');

describe('Dummy test to track Purolator: ', function() {
  // override the default 2000ms timeout
  this.timeout(0);

  it('#0416762345', function(done) {
    var courier = Couriers.getCourier('Estes');
    var trackings = new Trackings();
    trackings.push(new Tracking({
      tracking_number: '0416762345'
    }));

    courier.getTrackings(trackings, function(err, trackings) {
      console.log('calling getTrackings final callback...');
      done();
    });
    
  });

});
