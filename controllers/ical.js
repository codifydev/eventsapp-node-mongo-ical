Event     = require('../models/Event').Event;
var ical = require('cozy-ical')
  , months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  , request = require('request')
  , moment = require('moment')
  , async = require('async')
  , requestsync = require('request-sync')

var url_ics_nodeconf = 'http://lanyrd.com/topics/nodejs/nodejs.ics';
var url_ics_ncsu = 'http://calendar.activedatax.com/ncstate/downloadevents.aspx?crawl=true&export=export&fType=ical&futureevents=true&type=N&ctgrys=public&approved=approved';
var url_ics_csc_ncsu = 'http://www.google.com/calendar/ical/ncsu.edu_hpasl5cmtenq7biv0omve1nvq8%40group.calendar.google.com/public/basic.ics'

function ParseFeed(url){
  //default values
  this.organization = "NCSU";
  this.geolat = "35.772013";
  this.geolon = "-78.674127";

  this.url = url;

}

ParseFeed.prototype.parseCSC = function (cb) {
  var now = moment();
  var result = [];
  var organization = this.organization;
  var geolat = this.geolat;
  var geolon = this.geolon;

  var location = {};

  request(url_ics_csc_ncsu, {}, function(err, r, data){
      if (err)
        return printToConsole("Error requesting" + url_ics_csc_ncsu);
      parser = new ical.ICalParser();
      parser.parseString(data, function(err, cal) {
        for (var i in cal.subComponents){
          var eachEvent = {};
          eachEvent = cal.subComponents[i];
          var startdate = moment(cal.subComponents[i].fields.DTSTART, 'YYYYMMDDTHHmm00Z');
          var enddate = moment(cal.subComponents[i].fields.DTEND, 'YYYYMMDDTHHmm00Z');

          if (enddate.isAfter() && startdate.isBefore("2015")){
            //console.log("CSC Events: " + enddate.format("dddd, MMMM Do YYYY, h:mm:ss a"));
            //console.log(eachEvent);
          }

        }//END FOR LOOP

      cb("csc",result);
    });//END PARSER
  });//END REQUEST

}//END parseCSC


ParseFeed.prototype.parseNCSU = function (cb) {
  var result = [];
  var organization = this.organization;
  var geolat = this.geolat;
  var geolon = this.geolon;

  var location = {};

  request(url_ics_ncsu, {}, function(err, r, data){
      if (err)
        return printToConsole("Error requesting" + url_ics_ncsu);
      parser = new ical.ICalParser();
      parser.parseString(data, function(err, cal) {
        for (var i in cal.subComponents){
          var eachEvent = {};

          eachEvent["title"] = cal.subComponents[i].fields.SUMMARY;
          eachEvent["date"] = {};
          var startdate = moment(cal.subComponents[i].fields.DTSTART, 'YYYYMMDDTHHmm00Z');
          var enddate = moment(cal.subComponents[i].fields.DTEND, 'YYYYMMDDTHHmm00Z');
          eachEvent["date"]["start"] = startdate.format('YYYY-MM-DDTHH:mm:00Z')
          eachEvent["date"]["end"] = enddate.format('YYYY-MM-DDTHH:mm:00Z')
          eachEvent["location"] = {};
          eachEvent["location"]["address"] = cal.subComponents[i].fields.LOCATION;
          console.log(cal.subComponents[i].fields)
          var loc = cal.subComponents[i].fields.LOCATION;
           var url = "https://maps.googleapis.com/maps/api/geocode/json?address=" + loc + "+ncsu&sensor=false";
          console.log(url)
           var response = requestsync(url);
          console.log(response.body);
          var data = JSON.parse(response.body);
          if (data.results.length > 0){
            var lng = data.results[0].geometry.location.lng;
            var lat = data.results[0].geometry.location.lat;
            eachEvent["location"]["geo"] = {};
            eachEvent["location"]["geo"]["lat"] = lat;
            eachEvent["location"]["geo"]["lon"] = lng;
          }
          eachEvent["info"] = cal.subComponents[i].fields.DESCRIPTION;
          eachEvent["price"] = 0;
          eachEvent["organization"] = organization;
          eachEvent["maxattendees"] = 0;
          //eachEvent["uid"] = cal.subComponents[i].fields.UID; //unique id from server, for matching
          //console.log("Conference", ev.summary, 'is in',  ev.location, 'on the', ev.start.getDate(), 'of', months[ev.start.getMonth()] );
          if (enddate.isAfter() && startdate.isBefore("2015")){
            result.push(eachEvent);
          }

        }//END FOR LOOP
        cb("ncsu",result);
    });//END PARSER
  });//END REQUEST

}//END parseNCSU

var ncsu_done = false;
var csc_done = false;


exports.parseAllEvents = function(req,res){

  var result_ncsu = [];
  var result_csc = [];

  function report_done(who, result) {
    if (who == "ncsu") {
      ncsu_done = true;
      result_ncsu = result;

    async.eachSeries(result_ncsu, function (event, callback) {
      var newEvent = new Event(event);
        newEvent.save(function(err) {
        if(err){
          console.log("Error at saving event" + err);
        } else {
          //console.log("Event pushed to DB: %j", newEvent.title)
        }
        });
        //console.log("here");

      callback(); // Alternatively: callback(new Error());
      }, function (err) {
      if (err) { throw err; }
      console.log('Done Parsing');
    });

    }

    if (ncsu_done) {
      req.flash('info', {type: 'success', message: 'Successfully Parsed Calendars: [NCSU , Computer Science NCSU]'});
      res.redirect('/events');
    }
  }

  var CalendarParser = new ParseFeed();
  CalendarParser.parseNCSU(report_done);
  //CalendarParser.parseCSC(report_done);

}//end parseAllEvents
