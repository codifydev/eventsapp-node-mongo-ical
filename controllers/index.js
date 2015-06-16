Event     = require('../models/Event').Event;

exports.home = function(req, res){
  var now = new Date();
  Event.find({'date.end': { $gte: now} }).exec(function(err, events){
    if (!events){
      console.log("There are no events.");
      res.send("There are no events.");
    } else if (err){
      console.log(err);
      res.send('Cant find events');
    } else {
      for(var i in events) {
        if (parseInt(events[i].price) == 0) events[i].price_beauty = "free";
        else events[i].price_beauty = "$" + parseFloat(events[i].price).toFixed(2);
      }
      res.render('index', { title: 'Express', events : events, notification: req.flash('info')[0] });
    }
  });
};
