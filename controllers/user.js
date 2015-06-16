Event 	  = require('../models/Event').Event;

/*
	WEB PAGE ENDPOINTS
	TYPE = GET
*/


exports.getLogin = function(req, res){
	res.render('login', {});//************************************************
}
exports.getRegister = function(req, res){
	res.render('register.html');
}

exports.getDashboard = function(req, res){
	//TODO: Cookie Monster needs user id from cookie...
	var userRole = typeof req.user !== 'undefined' ? req.user.role : "none";
	if (req.user) {
		var daysBool = [false,false,false,false,false,false,false];
		for (var i in req.user.preferences.days){
			daysBool[parseInt(req.user.preferences.days[i])] = true;
		}

		var now = new Date();
		Event.find({
			'date.end': { $gte: now} 
			, 'price' : { $lte: req.user.preferences.price.max}
			, 'price' : { $gte: req.user.preferences.price.min}
		}).sort('-date.start').exec(function(err, events){
			if (err){
				console.log(err);
				res.render('dashboard.html', {
						user: req.user
					, notification: req.flash('info')[0]
					, recommendedEvents : []
					, days: daysBool
					, userRole: userRole
					, attendingEvents : []

				});
			} else if (!events){
				console.log("There are no events.");
				res.render('dashboard.html', {
						user: req.user
					, notification: req.flash('info')[0]
					, recommendedEvents : []
					, days: daysBool
					, userRole: userRole
					, attendingEvents : []

				});
			} else {

				var recommendedEvents = [];

				for (var i in events){
					var event = events[i];
					var valid = true;

					if ((req.user.preferences.days.length > 0) && (req.user.preferences.days.indexOf(event.date.start.getDay()) == -1)){
						valid = false;
					}

					if (valid){
						recommendedEvents.push(event);
					}

					if (recommendedEvents.length >= 5){
						break;
					}
				}

				Event.getListEvents(req.user.attending, function(attendingEvents){
					console.log('RECOMMENDED');
					console.log(recommendedEvents);
					console.log('ATTENDING');
					console.log(attendingEvents);
					res.render('dashboard.html', {
							user: req.user
						, notification: req.flash('info')[0]
						, recommendedEvents: recommendedEvents
						, days: daysBool
						, userRole: userRole
						, attendingEvents : attendingEvents
					});
				});

			}
		});
	} else {
		res.redirect('/');
	}
	
}


exports.getEditUser = function(req, res){
	var userRole = typeof req.user !== 'undefined' ? req.user.role : "none";
	if (req.user){
		var daysBool = [false,false,false,false,false,false,false];
		for (var i in req.user.preferences.days){
			daysBool[parseInt(req.user.preferences.days[i])] = true;
		}
		res.render('editUser', {
				user : req.user
			, days : daysBool
			, userRole: userRole
		});
	} else {
		res.redirect('/'); 
	}
}

/*
	OTHER API ENDPOINTS
*/



exports.addUser = function(req, res) {
  User.register(new User({ 
			email : req.param('email')
		, username : req.param('username') 
		, role : req.param('role')
	}), req.param('password'), function(err, user) {
    if (err) {
      console.log(err);
      res.render('registerUser', { user : user });
    } else {
			res.redirect('/');
    }
  });
};

exports.editUser = function(req, res) {
	if (!req.user){
		res.redirect('/');
	} else {

		console.log('adr ' + req.param('address'));
		console.log('lat ' + req.param('latitude'));
		console.log('lon ' + req.param('longitude'));

		req.user.email = req.param('email');
		req.user.phone = req.param('phone');

		var maxPrice = parseFloat(req.param('maxPrice'))
			, minPrice = parseFloat(req.param('minPrice'))
			, days = req.param('days')
			, address = req.param('address')
			, lat = req.param('latitude')
			, lon = req.param('longitude');

		var price = req.user.preferences.price;

		if (maxPrice != NaN){
			price.max = maxPrice;
		}

		if (minPrice != NaN){
			price.min = minPrice;
		}
		
		if (price.max < price.min){
			price.max = price.min;
		}


		req.user.preferences.price = price;

		req.user.preferences.days = req.param('days');

		req.user.location.address = req.param('address');
		
		if ((lat != undefined) && (lon != undefined)){
			req.user.location.geo.lat = lat;
			req.user.location.geo.lon = lon;
		}

		req.user.save(function(err){
			if(err) console.log(err);
			res.redirect('/dashboard');
		});

	}

};


exports.logout = function(req, res){
	req.logout();
	res.redirect('/');
}
