var async = require('async');

Event 	  = require('../models/Event').Event;

/*
	WEB PAGE ENDPOINTS
	TYPE = GET
*/

exports.getAllEvents = function(req,res){
	var now = new Date();
	var userRole = typeof req.user !== 'undefined' ? req.user.role : "none";
	Event.find({'date.end': { $gte: now} }).exec(function(err, events){
		if (err){
			console.log(err);
			res.render('browse.html', {events: [], userRole: userRole});
		} else if (!events){
			console.log("There are no events.");
			res.render('browse.html', {events: [], userRole: userRole});
		} else {
			//console.log(events);
			var organizations = [];
			async.eachSeries(events, function(event, callback){
				if (parseInt(event.price) == 0) {
					event.price_beauty = "FREE";
				} else {
					event.price_beauty = "$" + parseFloat(event.price).toFixed(2);
				}
				if (organizations.indexOf(event.organization) == -1){
					organizations.push(event.organization);
				}
				callback(null);
			}, function(err){
				console.log(err);
				console.log(organizations);
				res.render('browse.html',{
						events : events
					, organizations : organizations
					, days : [true, true, true, true, true, true, true]
					, notification: req.flash('info')[0]
					, minPrice: 0
					, maxPrice: 500
					, userRole: userRole
				});
			});


		}
	});
}



exports.getEvents_Search = function(req,res){
	var searchFor = req.param('search');
	var userRole = typeof req.user !== 'undefined' ? req.user.role : "none";
	if ( searchFor.length == 0 ){
		res.render('browse.html', {events: [], userRole: userRole});
	} else {
		var now = new Date()
		Event.find({'date.end': { $gte: now} }).exec(function(err, events){
			if (err){
				console.log(err);
				res.render('browse.html', {events: [], userRole: userRole});
			} else if (!events){
				console.log("There are no events.");
				res.render('browse.html', {events: [], userRole: userRole});
			} else {
				var resultEvents = [];
				var searchQuery = req.param('search').replace(" ","|");
				var searchRegex = RegExp(searchQuery, "i");

				var organizations = [];

				async.filter(events, function(event, callback){
					console.log(event.title);
					var valid = false;
					if (event.title.search(searchRegex) >= 0){
						valid = true;
					} else if (event.info.search(searchRegex) >= 0){
						valid = true;
					} else if (event.organization.search(searchRegex) >= 0){
						valid = true;
					}

					if (parseInt(event.price) == 0) {
						event.price_beauty = "FREE";
					} else {
						event.price_beauty = "$" + parseFloat(event.price).toFixed(2);
					}

					if ((valid) && (organizations.indexOf(event.organization) == -1)){
						organizations.push(event.organization);
					}

					callback(valid);

				}, function(results){
					console.log(results);
					res.render('browse.html', {
							events : results
						, organizations : organizations
						, days : [true, true, true, true, true, true, true]
						, minPrice : 0
						, maxPrice : 500
						, userRole: userRole
					});
				});
			}
		});


	}


}


exports.getEvents_Filtered = function(req,res){

	var days = req.param('days')  //Make sure this is array
		, minPrice = parseFloat(req.param('minPrice'))
		, maxPrice = parseFloat(req.param('maxPrice'))
		, orgs = req.param('organizations');  //Make sure this is array
	var userRole = typeof req.user !== 'undefined' ? req.user.role : "none";
	var daysInt = [];
	for (var i in days){
		daysInt[i] = parseInt(days[i]);
	}
	days = daysInt;
	console.log(days);

	var now = new Date()
	Event.find({'date.end': { $gte: now} }).exec(function(err, events){
		if (err){
			console.log(err);
			res.render('browse.html', {events: [], userRole: userRole});
		} else if (!events){
			console.log("There are no events.");
			res.render('browse.html', {events: [], userRole: userRole});
		} else {
			var resultEvents = [];
			var organizations = [];
			async.filter(events, function(event, callback){
				var valid = true;
				//Check Days
				if ((days) && (days.length > 0)){
					var day = event.date.start.getDay();

					valid  = (days.indexOf(day) >= 0) 					
				}

				if ((valid)&&(minPrice != NaN) && (maxPrice != NaN)){
					valid = ((event.price >= minPrice) && (event.price <= maxPrice));
				}
				if ((valid)&&(orgs) && (orgs.length > 0)){
					valid = (orgs.indexOf(event.organization) >= 0)
				}

				if ((valid) && (organizations.indexOf(event.organization) == -1)){
					organizations.push(event.organization);
				}

				if (parseInt(event.price) == 0) {
					event.price_beauty = "FREE";
				} else {
					event.price_beauty = "$" + parseFloat(event.price).toFixed(2);
				}
				callback(valid);

			}, function(results){
				var daysBool = [false,false,false,false,false,false,false];
				for (var d in days){
					daysBool[parseInt(days[d])] = true;
				}

				res.render('browse.html', {
						events : results
					, organizations : organizations
					, days : daysBool
					, maxPrice: maxPrice
					, minPrice: minPrice
					, userRole: userRole
				});
			});
		}
	});
}





exports.getEvent = function(req, res){
	var eventId = req.param('eventId');
	Event.findOne({_id : eventId}).populate('attendees').exec(function(err, event){
		if (err){
			console.log(err);
			res.redirect('/events');
		} else if (!event){
			console.log("There is no event for id: "+eventId);
			res.redirect('/events');
		} else {
			async.map(event.attendees, function(user, callback){
				callback(null, user.username);
			}, function(err, results){

				if (parseInt(event.price) == 0) event.price_beauty = "Free";
				else event.price_beauty = "$" + parseFloat(event.price).toFixed(2);

				var attending;
				if(req.user){
					var index = results.indexOf(req.user.username);
					if(index >= 0){
						attending = true;
					}
					else{
						attending = false;
					}
				}
				var userRole = 'none';
				if (req.user){
					userRole = req.user.role;
				}
				res.render('event.html',{event: event,
                                 attendees : results,
                                 isAttending : attending,
                                 notification: req.flash('info')[0],
                                 userRole : userRole});
			});

		}
	});
}

exports.getEventCreate = function(req, res){
	res.render('create.html');
}

exports.getEventEdit = function(req, res){
	var eventId = req.param('eventId');
	Event.findOne({_id : eventId}).exec(function(err, event){
		if(err){
			console.log(err);
			res.redirect('/events');
		} else if(!event){
			console.log("There is no event for id: "+eventId);
			res.redirect('/events');
		} else {
			res.render('', {});//*******************************
		}
	});
}



/*
	OTHER API ENDPOINTS
*/
//TYPE = POST
exports.createEvent = function(req, res){
	var event = new Event({
			title : req.param('title')
	  , date  : {
	  			start : new Date(req.param('startDate'))
	  	  , end : new Date(req.param('endDate'))
	  	}
	  , location : {
	  			address : req.param('address')
	  		, geo : {
	  					lat : req.param('latitude')
	  		 		, lon : req.param('longitude')
	  		 }
	  	}
	  , price        : req.param('price')
	  , info         : req.param('info')
	  , organization : req.param('organization')
	  ,	maxattendees : req.param('maxattendees')
	});
	event.save(function(err) {
		if(err){
			console.log(err);
			var resEvent = {
					title : event.title
				, startDate : event.date.start
				, endDate : event.date.end
				,
			}
			res.render()
		} else {
			res.redirect('/events');
		}
	});
};

exports.attendEvent = function(req, res){
	if (!req.user){
		res.redirect('/register');
	} else {
		var eventId = req.param('eventId');
		Event.findOne({_id : eventId}).exec(function(err,event){
			if(err){
				console.log(err);
				res.send('Cant find event');//***************************
			}
			else if(!event){
				console.log("There is no event for id: "+eventId);
				res.send("There is no event for id: "+eventId);//***************************
			}
			else{
				req.user.attending.push(eventId);
				req.user.save(function(err){
					event.attendees.push(req.user._id);
					event.save(function(err){
						if(err){
							console.log(err);
							res.send("Can't save user!");//***************************
						} else {
							req.flash('info', {type: 'success', message: 'Event attend intention has been recorded!'});
							res.redirect('/events/'+eventId);
						}
					});
				});
			}
		});
	}
}

exports.unattendEvent = function(req, res){
	var eventId = req.param('eventId');
	Event.findOne({_id : eventId}).exec(function(err,event){
		if(err){
			console.log(err);
			res.send('Cant find event');//***************************
		}

		else if(!event){
			console.log("There is no event for id: "+eventId);
			res.send("There is no event for id: "+eventId);//***************************
		}

		else{
			var userIndex = req.user.attending.indexOf(eventId);
			if(userIndex >= 0){
				req.user.attending.splice(userIndex,1);
				req.user.save(function(err){
					if (err){
						console.log(err);
						res.send(err); //******************************************************
					} else {
						var eventIndex = event.attendees.indexOf(req.user._id);
						if(eventIndex >= 0){
							event.attendees.splice(eventIndex,1);
							event.save(function(err){
								if(err){
									console.log(err);
									res.send("Can't unattend user!");//***************************
								} else {
									req.flash('info', {type: 'success', message: 'Event unattend intention has been recorded!'});
									res.redirect('/events/'+eventId);
								}
							});
						}
						else{
							res.send("User not in list of attendees!");//***************************
						}
					}

				});
			}
			else{
				res.send('SOmething bad');  //******************************************************
			}
		}
	});
}
//TYPE = PUT
exports.updateEvent = function(req, res){
	var eventId = req.param('eventId');
	Event.findOne({_id : eventId}).exec(function(err, event){
		if(err) {
			console.log(err);
			res.send('Cant find event');//***************************
		}

		else if (!event){
			console.log("There is no event for id: "+eventId);
			res.send("There is no event for id: "+eventId);//***************************
		}
		else {
			event.title = req.param('title');
			event.date = {
	  			start : new Date(req.param('startTime'+' '+'startDate'))//NEEDS VALIDATION && REMOVE START/END TIME
	  	  	  , end   : new Date(req.param('endTime'+' '+'endDate'))	//NEEDS VALIDATION
	  	};
		  event.location     = req.param('location');
		  event.price        = req.param('price');
		  event.info         = req.param('info');
		  event.organization = req.param('org');
		  console.log(event)

			event.save(function(err){
				if(err){
					console.log(err);
					res.send("Can't save data!");//***************************
				} else {
					res.send('It has been updated');//***************************
				}
			});
		}
	});
}
//TYPE = DELETE
exports.deleteEvent = function(req, res){
	var eventId = req.param('eventId');
	Event.findOne({_id : eventId}).exec(function(err, event){
		if (err) {
			console.log(err);
			res.send('Cant find event');//***************************
		} else if (!event) {
			console.log("There is no event for id: "+eventId);
			res.send("There is no event for id: "+eventId);//*******************************
		} else {
			event.remove(function(err){
				if(err){
					console.log(err);
				} else {
					res.redirect('/events');														//*******************************
				}
			});
		}
	});
}



