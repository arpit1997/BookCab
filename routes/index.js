var express = require('express');
var http = require('http');
var async = require('async');
var request = require('request');
var router = express.Router();
var API_HOST = "https://roads.googleapis.com/";
var API_PATH = "v1/nearestRoads?points=";
var API_KEY = "&key=AIzaSyASz6Gqa5Oa3WialPx7Z6ebZTj02Liw-Gk";

router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/api/drivers', function (req, res, next) {
    generate(function (data) {
        res.send(JSON.stringify(data));
    });
});
router.get('/api/region', function (req, res, next) {
    var angle = 2*Math.PI*0.25;
    var lat = 20*Math.cos(angle)*0.00904470708 + 23.173244;
    var lng = 20*Math.sin(angle)*0.00959214211 + 72.813143;
    res.send(JSON.stringify({lat:lat, lng:lng}))
});


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
                    regions.push(Math.floor(Math.random()*3))
                }
                regions[Math.floor(Math.random()*4)] = 3;
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
                    passengers: passengers
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

