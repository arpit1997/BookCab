var mongoose = require('mongoose');
require('mongoose-double')(mongoose);
var Schema = mongoose.Schema;
var SchemaTypes = mongoose.Schema.Types;

var createCollections = function () {
    var bookings = new Schema({
        passengername: String,
        passengerphonenumber: String,
        drivername: String,
        driverphonenumber: String,
        src: {
            lat: SchemaTypes.Double,
            lng: SchemaTypes.Double
        },
        dst: {
            lat: SchemaTypes.Double,
            lng: SchemaTypes.Double
        },
        passengers: Number,
        driverDistance: SchemaTypes.Double
    });
    module.exports = mongoose.model('Bookings', bookings);
};
createCollections();