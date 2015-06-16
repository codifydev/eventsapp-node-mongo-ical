var mongoose = require('mongoose')
  , async = require('async')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.SchemaTypes.ObjectId;

var EventSchema = new Schema({
    title: { type: String, required: true }
  , date: {  
  			start : {type: Date, required: true }
  		,	end		: {type: Date, required: true }
  	}
  
  , location : {
        address : { type: String, required: true }
      , geo: {
          lon: Number
        , lat: Number
      }
    }
  , price: { type: Number, required: true }
  , info: { type: String, required: true }
  , organization: { type: String, required: true }
  , attendees : [ { type: ObjectId, ref: 'User' } ]
  , maxattendees: {type: Number, required: true}
  , created : { type: Date, default : Date.now }

});

EventSchema.statics.findFilteredEvents = function(){};


EventSchema.statics.getListEvents = function(list, callback){
  async.mapSeries(list, function(eventId, callback){
    var now = new Date();
    Event.findOne({_id: eventId, 'date.end': { $gte: now} })
    .sort('-date.start').exec(function(err, event){
      if (err){
        callback(err, null);
      } else if (!event){
        callback('No event by that Id', null);
      } else {
        callback(null, event);
      }
    });
  }, function(err, results){
    if (err){
      console.log(err);
      callback([]);
    } else {
      callback(results);
    }
  });


}

exports.Event = mongoose.model('Event', EventSchema);
