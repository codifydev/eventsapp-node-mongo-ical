var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = mongoose.SchemaTypes.ObjectId
  , passportLocalMongoose = require('passport-local-mongoose');

var UserSchema = new Schema({
    username: { type: String, required: true, unique: true }
  , email: { type: String, required: true, unique:true }
  , phone: { type: String, default: "" }
  , created: { type: Date, required: true, default: Date.now }

  , role: { type: String, required: true, enum: ['user', 'coordinator', 'admin'] }

  , location : {
      address : { type: String, default: "" }
    , geo: {
        lon: Number
      , lat: Number
    }
  }


  , attending: [{  type: ObjectId, ref: 'Event' }]

  , preferences: {
      price : {
          min : {type: Number, default: 0}
        , max : {type: Number, default: 500}
      }
    , max_radius : {type: Number, default : 15 }
    , days : [ ] //0-6  Sunday - Saturday
  }
  //Additional User Fields can go here
});


UserSchema.plugin(passportLocalMongoose);

exports.User = mongoose.model('User', UserSchema);
