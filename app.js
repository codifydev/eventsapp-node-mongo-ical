
/**
 * Module dependencies.
 */

var express = require('express')
	, http = require('http')
	, path = require('path')
	, app = express()
	, passport = require('passport')
	, LocalStrategy = require('passport-local').Strategy
	, flash = require('connect-flash')
	;

/**
 *	Local Dependencies
 */
var routes = require('./controllers/controller')
	, settings = require('./settings');

/**
 * Model Dependencies
 */
User      = require('./models/User').User;
Event 	  = require('./models/Event').Event;


//***************************************************************

// all environments
app.set('port', settings.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);


app.configure(function(){
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.json());
	app.use(express.urlencoded());
	app.use(express.methodOverride());
	//app.use(require('stylus').middleware(path.join(__dirname, 'public')));
	app.use(flash());

	app.use(express.static(path.join(__dirname, 'public')));

	app.use(express.cookieParser(settings.CookieSecret));
	app.use(express.bodyParser());
	app.use(express.session({secret: settings.CookieSecret}));

	app.use(passport.initialize());
	app.use(passport.session());

	app.use(app.router);
});


if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


passport.use(new LocalStrategy( User.authenticate() ) );

passport.serializeUser( 	User.serializeUser() 		);
passport.deserializeUser(	User.deserializeUser()	);

app.post('/login',
  passport.authenticate('local', { successRedirect: '/events',
                                   failureRedirect: '/',
                                   failureFlash: true })
);

/*****************************************

			API ENDPOINTS

******************************************/




app.get('/', 							routes.index.home);
app.get('/login', 						routes.user.getLogin);
app.get('/logout', 						routes.user.logout);
app.get('/register', 					routes.user.getRegister);
app.get('/dashboard', 					routes.user.getDashboard);
app.get('/events', 						routes.event.getAllEvents);
app.get('/user/edit', 					routes.user.getEditUser);
app.get('/events/create', 				routes.event.getEventCreate);
app.get('/events/:eventId', 			routes.event.getEvent);
app.get('/events/:eventId/edit', 		routes.event.getEventEdit);
app.get('/events/:eventId/delete', 		routes.event.deleteEvent);
app.get('/events/:eventId/attend',		routes.event.attendEvent);
app.get('/events/:eventId/unattend',	routes.event.unattendEvent);
app.get('/calendar',                   routes.ical.parseAllEvents);

app.post('/user',						routes.user.editUser);

app.post('/register', 					routes.user.addUser);
app.post('/events', 					routes.event.createEvent);
app.post('/events/search', 				routes.event.getEvents_Search);
app.post('/events/filter', 				routes.event.getEvents_Filtered);
app.post('/events/:eventId', 			routes.event.updateEvent);

//*********************************************************************

http.createServer(app).listen(settings.port, function(){
  console.log('Express server listening on port ' + app.get('port'));
});
