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
    var queue;
    var drivers_loc = [] ;
    var drivers = [];
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
    }, function() {
        console.log(drivers_loc.length);
        res.send(JSON.stringify(drivers));
        console.log("done");
    });

});
module.exports = router;

