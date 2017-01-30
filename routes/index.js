var express = require('express');
var http = require('http');
var async = require('async');
var request = require('request');
var faker = require('faker');
const fs = require('fs');
var mongoose = require('mongoose');
var router = express.Router();
var bookings = require('../models/bookings.js');
var API_HOST = "https://roads.googleapis.com/";
var API_PATH = "v1/nearestRoads?points=";
var API_KEY = "&key=AIzaSyASz6Gqa5Oa3WialPx7Z6ebZTj02Liw-Gk";
var uri = 'mongodb://arpit:9829667088@ds159497.mlab.com:59497/todo';


router.get('/', function(req, res, next) {
    res.render('index');
});

router.get('/api/drivers/generate', function (req, res, next) {
    generate(function (data) {
        fs.writeFile('./data/drivers.json', JSON.stringify(data), function (err) {
            if (err){
                console.log(err);
                res.send("Failed to save file");
            }
            console.log("file saved");
            res.json(data);
        });
    });
});
router.get('/api/drivers/get', function (req, res, next) {
   fs.readFile('./data/drivers.json', function (err, data) {
       if (err){
           console.log(err);
           res.send("failed to get data");
       }
       console.log("file opened");
       var content = JSON.parse(data);
       res.json(content);
   }) 
});
router.get('/api/region', function (req, res, next) {
    var angle = 2*Math.PI*0.75;
    var lat = 20*Math.cos(angle)*0.00904470708 + 23.173244;
    var lng = 20*Math.sin(angle)*0.00959214211 + 72.813143;
    res.json({lat:lat, lng:lng});
});

router.post('/api/book', function (req, res) {
    console.log("hello");
    var src_lat = req.body.src_lat;
    var src_lng = req.body.src_lng;
    var dest_lat = req.body.dest_lat;
    var dest_lng = req.body.dest_lng;
    var pass_name = req.body.pass_name;
    var pass_phone = req.body.pass_phone;
    var passengers = parseInt(req.body.passengers);
    var origin = [];
    origin.push({lat:src_lat, lng:src_lng});
    var destination = [];
    destination.push({lat:dest_lat, lng: dest_lng});
    console.log("world");
    var current_time = new Date().getHours();
    console.log(current_time);
    var time_slot_index = Math.floor(current_time / 2);
    var result = [];
    fs.readFile('./data/drivers.json', function (err, data) {
        if (err){
            console.log(err);
            res.send("failed to get data");
        }
        console.log("file opened");
        var content = JSON.parse(data);
        for (var i=0; i<10; i++){
            var time_slot = content[i].time_slots;
            console.log(time_slot);
            if (time_slot[time_slot_index] == 1){
                result.push(content[i]);
            }
        }
        calculateDistance(result, origin, function (data) {
            console.log(data);
            console.log(result);
            console.log("world war");
            calculateScore(result, passengers, dest_lat, dest_lng, function (data) {
                if (data.length != 0){
                    console.log(data);
                    databaseEntry(origin, destination, data[0], pass_name, pass_phone, function () {
                        console.log(data[0]);
                        res.json(data[0]);
                    });
                }
                
            });
        });

    });
});

function databaseEntry(origin, destination, data, name, phone, callback) {
    var booking = new bookings({
        passengername: name,
        passengerphonenumber: phone,
        drivername: data.drivername,
        driverphonenumber: data.driverphonenumber,
        passengers: data.passengers,
        driverDistance: data.distance,
        src: {
            lat: origin[0].lat,
            lng: origin[0].lng
        },
        dst: {
            lat: destination[0].lat,
            lng: destination[0].lng
        }
    });
    mongoose.connect(uri);
    var db = mongoose.connection;
    db.once('open', function () {
        console.log("connected");
        booking.save();
        mongoose.disconnect();
        callback();
    });
}


function calculateScore(result, passengers, dest_lat, dest_lng, callback) {
    result.sort(function (a, b) {
        return a.distance - b.distance
    });
    var d_p = 0;
    for (var i=0; i<result.length; i++){
        if (i <= 3){
            d_p = 3-i
        }
        var p = result[i].passengers == passengers ? 1: 0;
        var count = 0;
        var result_frame = result[i].region;
        calculateRegion(dest_lat, dest_lng, function (region) {
            for (var key in result_frame){
                if (result_frame.hasOwnProperty(key)){
                    console.log(region);
                    if (count == region){
                        var r = result_frame[key];
                    }
                    else {
                        count++;
                    }
                }

            }
            result[i].score = p+r+(d_p);
        })
    }
    callback(result);
}

function calculateRegion(lat, lng, callback) {
    if ((lat >= 23.173244 && lat <= 23.3541381416) && (lng >= 72.813143 && lng <= 73.0049858422)){
        callback(0)
    }
    else{
        if ((lat >= 22.9923498584 && lat <= 23.173244) && (lng >= 72.813143 && lng <= 73.0049858422)){
            callback(1)
        }
        else{
            if ((lat >= 22.9923498584 && lat <= 23.173244) && (lng >= 72.6213001578 && lng <= 72.813143)){
                callback(2)
            }
            else{
                callback(3)
            }
        }
    }
}

function calculateDistance(result, origin, callback) {
    var distances = [];
    function asyncForEach(arr, iterator, callback) {
        queue = arr.slice(0);
        // create a recursive iterator
        function next(err) {
            if (err) return callback(err);

            // if the queue is empty, call the callback with no error
            if (queue.length === 0) return callback(null);

            // call the callback with our task
            // we pass `next` here so the task can let us know when to move on to the next task
            iterator(queue.shift(), next);
        }

        // start the loop;
        next();
    }
    function sampleAsync(uri, done) {
        var driver_lat = uri.location.lat;
        var driver_lng = uri.location.lng;
        var orig_lat = origin[0].lat;
        var orig_lng = origin[0].lng;
        var URL = "https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&mode=driving&"+
            "origins="+driver_lat+","+driver_lng+"&destinations="+orig_lat+","+orig_lng+API_KEY;
        console.log(URL);
        request(URL, function (err, response, body) {
            console.log(body);
            body = JSON.parse(body);
            if (body.status == "OK"){
                console.log("status ok");
                var dist_dur = body.rows[0].elements[0];
                var distance = dist_dur.distance.value;
                var duration = dist_dur.duration.value;
                distances.push({distance:distance, duration:duration});
                uri.distance = distance;
                uri.duration=  duration;
                message = "world";
                done(message);
            }
        });

        }
    asyncForEach(result, function(uri, done) {
        sampleAsync(uri, function(message) {
            console.log(message);
            done();
        });
    },function () {
        console.log("callback");
        callback(distances);
    });

}


function generate(callback) {
    var queue;
    var drivers_loc = [] ;
    var drivers = [];
    var drivers_data = [];
    function generateRandom() {
        var dist = Math.floor(Math.random()*20);
        var angle  = Math.random()*Math.PI*2;
        var lat = dist*Math.cos(angle)*0.00904470708 + 23.173244;
        var lng = dist*Math.sin(angle)*0.00959214211 + 72.813143;
        return {lat:lat, lng:lng}
    }
    for(var i=0; i<100; i++){
        var point = generateRandom();
        drivers_loc.push(point)
    }
    function asyncForEach(arr, iterator, callback) {
        queue = arr.slice(0);
        // create a recursive iterator
        function next(err) {
            if (err) return callback(err);

            // if the queue is empty, call the callback with no error
            if (queue.length === 0) return callback(null);

            // call the callback with our task
            // we pass `next` here so the task can let us know when to move on to the next task
            iterator(queue.shift(), next);
        }

        // start the loop;
        next();
    }
    function sampleAsync(uri, done) {
        var URL = API_HOST + API_PATH + uri.lat + "," + uri.lng + API_KEY;
        request(URL, function (err, response, body) {
            console.log(body);
            if (body.length > 10){
                drivers.push(body);
                body = JSON.parse(body);
                var lat = body.snappedPoints[0].location.latitude;
                var lng = body.snappedPoints[0].location.longitude;
                var regions = [];
                for (i=0; i<4; i++){
                    regions.push(Math.random() <= 0.5 ? 1: 0);
                }
                var time_slots = [];
                var count = 0;
                var passengers = Math.random() <= 0.5 ? 5: 7;
                for (var i=0; i<12; i++){
                    var c = Math.random() <= 0.5 ? 1: 0;
                    if (c == 1){
                        count++;
                    }
                    if (count > 6){
                        c = 0;
                    }
                    time_slots.push(c);
                }
                var data = {
                    location: {lat:lat, lng:lng},
                    region: {
                        r1: regions[0],
                        r2: regions[1],
                        r3: regions[2],
                        r4: regions[3]
                    },
                    time_slots: time_slots,
                    passengers: passengers,
                    drivername: faker.name.findName(),
                    driverphonenumber: faker.phone.phoneNumber()
                };
                drivers_data.push(data);

            }
            if (drivers.length == 10){
                queue.length = 0;
            }
            message = "world";
            done(message);
        })
    }
    asyncForEach(drivers_loc, function(uri, done) {
        sampleAsync(uri, function(message) {
            console.log(message);
            done();
        });
    },function () {
        callback(drivers_data);
    });

}
module.exports = router;

