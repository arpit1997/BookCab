var express = require('express');
var http = require('http');
var async = require('async');
var request = require('request');
var faker = require('faker');
const fs = require('fs');
var mongoose = require('mongoose');
var router = express.Router();
var bookings = require('../models/bookings.js');
var helper = require('../lib/helper.js');
var API_HOST = "https://roads.googleapis.com/";
var API_PATH = "v1/nearestRoads?points=";
var API_KEY = "&key=AIzaSyASz6Gqa5Oa3WialPx7Z6ebZTj02Liw-Gk";
var uri = 'mongodb://arpit:9829667088@ds159497.mlab.com:59497/todo';


router.get('/', function(req, res, next) {
    res.render('index');
});

router.get('/api/drivers/generate', function (req, res, next) {
    helper.generate(function (data) {
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
    console.log(pass_name);
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
        helper.calculateDistance(result, origin, function (data) {
            console.log(data);
            console.log(result);
            console.log("world war");
            helper.calculateScore(result, passengers, dest_lat, dest_lng, function (data) {
                if (data.length != 0){
                    console.log(data);
                    helper.databaseEntry(origin, destination, data[0], pass_name, pass_phone, function () {
                        console.log(data[0]);
                        res.json(data[0]);
                    });
                }
                
            });
        });

    });
});
module.exports = router;

