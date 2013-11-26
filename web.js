/******************************************************************************
 * Libraries
 *****************************************************************************/
var express = require("express");
var mongo = require('mongodb');
var gcal = require('google-calendar');
var q = require('q');
var calendars = require('./routes/calendars');
var engines = require('consolidate');
/******************************************************************************
 * Variables
 *****************************************************************************/
var oa;
var app = express();

var clientId = '143957689880.apps.googleusercontent.com';
var clientSecret = 'BSZUzMlGhlncSAWfHcv5mXf7';
var scopes = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/userinfo.profile';
var googleUserId;
var refreshToken;
var baseUrl;
var settings = {};

/******************************************************************************
 * App Setup
 *****************************************************************************/
app.configure('development',function(){
  console.log('!! DEVELOPMENT MODE !!');

  googleUserId = 'myusernamejeep@gmail.com';
  refreshToken = '';
  baseUrl = 'http://localhost:5000';
});

app.configure('production', function(){
  console.log('!! PRODUCTION MODE !!');

  googleUserId = 'GOOGLE_EMAIL_ADDRESS';
  refreshToken = 'GOOGLE_REFRESH_TOKEN';
  baseUrl = 'PRODUCTION_API_URL';
});

var allowCrossDomain = function(req, res, next){

  //instantiate allowed domains list
  var allowedDomains = [
    'http://localhost',
    'https://YOUR_DOMAIN.com'
  ];

  //check if request origin is in allowed domains list
  if(allowedDomains.indexOf(req.headers.origin) != -1)
  {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  }

  // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
    res.send(200);
    }
    else {
    next();
    }
};

var routes = require('./routes');
var tasks = require('./routes/tasks');
var http = require('http');
var path = require('path');

var passport = require('passport')
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;


app.use(express.methodOverride());
app.use(allowCrossDomain);
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
//app.use(express.session({secret: '59B93087-78BC-4EB9-993A-A61FC844F6C9'}));
app.use(express.cookieSession({secret: '59B93087-78BC-4EB9-993A-A61FC844F6C9'}));
app.use(express.csrf());
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
//app.use(express.session({ secret: 'my secret google calendar' }));
app.use(passport.initialize());
app.use('/js/lib/', __dirname + 'node_modules/requirejs/' );

app.engine('jade', require('jade').__express);
/*var mongoskin = require('mongoskin');
var db = mongoskin.db('mongodb://localhost:27017/recall?auto_reconnect', {safe:true});
app.use(function(req, res, next) {
  req.db = {};
  req.db.tasks = db.collection('tasks');
  next();
})*/

//app.use(require('less-middleware')({ src: __dirname + '/public', compress: true }));
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req, res, next) {
  res.locals._csrf = req.session._csrf;
  console.log('-- session res.locals.token' , res.locals.token)
  return next();
})
 
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.locals.pretty = true;
  sendgrid = {
    send: function(opts, cb) {
      //console.log('Email:', opts);
      cb(true, opts);
    }
  };
}
/******************************************************************************
 * SendGrid Setup
 *****************************************************************************/
var SendGrid = require('sendgrid').SendGrid
  , Validator = require('validator').Validator

app.locals.errors = {};
app.locals.message = {};

function csrf(req, res, next) {
  res.locals.token = req.session._csrf;
  console.log('-- res.locals.token' , res.locals.token)
  next();
}

function validate(message) {
  var v = new Validator()
    , errors = [];

  v.error = function(msg) {
    errors.push(msg);
  };

  v.check(message.name, 'Please enter your name').len(1, 100);
  v.check(message.email, 'Please enter a valid email address').isEmail();
  v.check(message.message, 'Please enter a valid message').len(1, 1000);

  return errors;
}

function sendEmail(message, fn) {
  sendgrid.send({
    to: process.env.EMAIL_RECIPIENT || "myusernamejeep@gmail.com"
  , from: message.email
  , subject: 'Contact Message'
  , text: message.message
  }, fn);
}

app.configure('production', function() {
  app.use(express.errorHandler());
  sendgrid = new SendGrid(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);
});



/********************************** contact *******************************************/
app.get('/contact', csrf, function(req, res) {
  var locals = {};
  res.render('contact.jade', locals);
});

app.post('/contact', csrf, function(req, res) {
  var message = req.body.message
    , errors = validate(message)
    , locals = {};

  function render() {
    res.render('contact.jade', locals);
  }

  if (errors.length === 0) {
    sendEmail(message, function(success) {
      if (!success) {
        locals.error = 'Error sending message';
        locals.message = message;
      } else {
        locals.notice = 'Your message has been sent.';
      }
      render();
    });
  } else {
    locals.error = 'Your message has errors:';
    locals.errors = errors;
    locals.message = message;
    render();
  }
});

app.get('/contacts', function(req, res) {
  res.redirect('/');
});

/******************************************************************************
 * SendGrid End
 *****************************************************************************/

app.param('task_id', function(req, res, next, taskId) {
  req.db.tasks.findById(taskId, function(error, task){
    if (error) return next(error);
    if (!task) return next(new Error('Task is not found.'));
    req.task = task;
    return next();
  });
});
app.use(app.router);

//app.get('/', routes.index);

/*
app.get('/tasks', tasks.list);
app.post('/tasks', tasks.markAllCompleted)
app.post('/tasks', tasks.add);
app.post('/tasks/:task_id', tasks.markCompleted);
app.del('/tasks/:task_id', tasks.del);
app.get('/tasks/completed', tasks.completed);
*/
/******************************************************************************
 * Database Setup
 *****************************************************************************/
var mongoCollectionName = 'recall';
var mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/default';
var database;
function connect(callback)
{
  var deferred = q.defer();

  if(database === undefined)
  {
    mongo.Db.connect(mongoUri, function(err, db){
      if(err) deferred.reject({error: err});

      database = db;
      deferred.resolve();
    });
  }
  else
  {
    deferred.resolve();
  }

  return deferred.promise;
}


/*
  ===========================================================================
            Setup express + passportjs server for authentication
  ===========================================================================
*/
passport.use(new GoogleStrategy({
    clientID: clientId,
    clientSecret: clientSecret,
    callbackURL: baseUrl+ "/auth/callback", //baseUrl+'/callback'
    scope: ['openid', 'email', 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/userinfo.profile'] 
  },
  function(accessToken, refreshToken, profile, done) {
    profile.accessToken = accessToken;
    return done(null, profile);
  }
));

app.get('/auth',
  passport.authenticate('google', { session: false }));

app.get('/auth/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  function(req, res) { 
    req.session.access_token = req.user.accessToken;
    var googleUserId = req.user._json.id;
    req.session.email = req.user._json.email;
    var access_token = req.user.accessToken
    connect().then(function(){
      database.collection(mongoCollectionName).findOne({google_user_id: req.session.email}, function(findError, _settings){
        console.log('--writing access token to database--');
        var accessTokenExpiration = new Date().getTime() + (3500 * 1000);
        
        //update access token in database
        var settings = {}
        settings.google_access_token = access_token;
        settings.google_id = googleUserId;
        settings.google_email = req.session.email;
        settings.google_access_token_expiration = accessTokenExpiration;
        req.session.access_token_expiration = accessTokenExpiration;

        database.collection(mongoCollectionName).save(settings);
        console.log('-- save settings --', settings);
        return res.redirect('/');
      });
    });
  });


/*
  ===========================================================================
                               Google Calendar
  ===========================================================================
*/

function access_token(req, res, next) {
  if(!req.session.access_token) return res.redirect('/auth');
   
  next();
}

if (process.env.NODE_ENV !== 'production') {
  app.use('/csrf', function (req, res, next) {
    res.json({
      csrf: req.session._csrf
    })
  })
}

app.all('/calendar', access_token, function(req, res){
  res.render('calendar', {
      title: 'Recollection',
      calendarId: ""
  });
});

app.all('/calendar/:calendarId', csrf, access_token,  function(req, res){
  var calendarId      = req.params.calendarId;

  res.render('calendar', {
      title: 'Recollection : Calendar#'  + calendarId,
      calendarId: calendarId
  });
});
 
app.all('/calendar/:calendarId/:eventId/edit', access_token, function(req, res){
 
  var accessToken = req.session.access_token;
  var calendarId      = req.params.calendarId;
  var eventId         = req.params.eventId;
  
  gcal(accessToken).events.get(calendarId, eventId, function(err, data) {
    if(err) return res.send(500,err);
    
    res.render('calendar_edit', {
        title: 'Recollection Edit',
        eventId: eventId,
        calendarId : calendarId,
        id: data.id || "",
        location : data.location || "",
        email : data.creator.email || "",
        enddate: data.end.date ? data.end.date : data.end.dateTime.split('T')[0] ,
        endtime  : data.end.date ? "" : data.end.dateTime.split('T')[1].split('+')[0] ,
        startdate : data.start.date ? data.start.date : data.start.dateTime.split('T')[0] ,
        starttime : data.start.date ? "" : data.start.dateTime.split('T')[1].split('+')[0] ,
        description : data.description || "",
        summary: data.summary || ""
    });
  });
});

app.all('/', access_token, function(req, res){
  var accessToken = req.session.access_token;
  console.log('****** accessToken *******' , accessToken);
     
  gcal(accessToken).calendarList.list(function(err, data) {
    if(err){
      return res.redirect('/auth');
    }
    //  return res.send(500,err);
    var date = new Date(), y = date.getFullYear(), m = date.getMonth();
    var start = new Date(y, m, 1);
    var end = new Date(y, m + 1, 0);  
    var calendarId      = req.params.calendarId || req.session.email;
    var query_param   = {
      "alwaysIncludeEmail" : "true",
      "singleEvents" : "true",
      "orderBy" : "startTime"
    };
    if(start){
      query_param['timeMin'] = start.toISOString();
    }
    if(end){
      query_param['timeMax'] = end.toISOString();
    } 

    //console.log('****** calendarId *******' , calendarId);
    console.log('****** query_param *******' , query_param);
    var getGoogleEvents = function(accessToken)
    {
      var google_calendar = new gcal.GoogleCalendar(accessToken);
      var _calendarId;
      if(calendarId != 'all'){
        _calendarId = calendarId;
      }else{
        _calendarId = googleUserId;
      }
      google_calendar.events.list(_calendarId, query_param, function(err, eventList){
        if(err){
          res.send(500, err);
        }
        else{
          console.log('****** eventList *******' , eventList);
    
          var results = [];
          for (var i = 0; i < eventList.items.length; i++) {
            var item = eventList.items[i];
            //console.log('****** item *******' , item);
    
            results.push({
              id: item.id,
              status: item.status,
              title: item.summary,
              description: item.description,
              start: item.start.date || item.start.dateTime,
              end: item.end.date || item.end.dateTime,
              url: item.htmlLink,
              "color":"#36F",
              calendarId:_calendarId
            });
          };  

          res.render('index', {
            title: 'Recollection',
            calendarList: data,
            events:results
          });
        }
      });
    };
    var accessToken = req.session.access_token;
    getGoogleEvents(accessToken);
    
  });


  
});
 
app.all('/calendar_events/:calendarId', access_token, function(req, res){
  var start         = req.query.start;
  var end           = req.query.end;
  var calendarId      = req.params.calendarId;
  var query_param   = {
    "alwaysIncludeEmail" : "true",
    "singleEvents" : "true",
    "orderBy" : "startTime"
  };
  if(start){
    query_param['timeMin'] = new Date(parseInt(start+'000')).toISOString();
  }
  if(end){
    query_param['timeMax'] = new Date(parseInt(end+'000')).toISOString();
  } 

  //console.log('****** calendarId *******' , calendarId);
  //console.log('****** query_param *******' , query_param);
  var getGoogleEvents = function(accessToken)
  {
    var google_calendar = new gcal.GoogleCalendar(accessToken);
    var _calendarId;
    if(calendarId != 'all'){
      _calendarId = calendarId;
    }else{
      _calendarId = req.session.email;
    }
    google_calendar.events.list(_calendarId, query_param, function(err, eventList){
      if(err){
        res.send(500, err);
      }
      else{
        //console.log('****** eventList *******' , eventList);
  
        var results = [];
        for (var i = 0; i < eventList.items.length; i++) {
          var item = eventList.items[i];
          //console.log('****** item *******' , item);
  
          results.push({
            id: item.id,
            status: item.status,
            title: item.summary,
            description: item.description,
            start: item.start.date || item.start.dateTime,
            end: item.end.date || item.end.dateTime,
            url: item.htmlLink,
            "color":"#36F",
            calendarId:_calendarId
          });
        };  

        res.writeHead(200, {"Content-Type": "application/json"});
        res.write(JSON.stringify(results, null, '\t'));
        res.end();
      }
    });
  };
  var accessToken = req.session.access_token;
  getGoogleEvents(accessToken);

});

app.delete('/event', access_token, function(request, response){
 
  console.log('****** request *******' , request.body );
  var calendarId = request.body.calendarId || request.session.email;
  var eventId = request.body.eventId;
  var accessToken     = request.session.access_token;
  var addGoogleEvent = function(accessToken){
    //instantiate google calendar instance
    var google_calendar = new gcal.GoogleCalendar(accessToken);
    console.log('****** ADDING GOOGLE EVENT *******', calendarId, eventId, accessToken);
 
    google_calendar.events.delete(calendarId, eventId, function(addEventError, addEventResponse){
      console.log('GOOGLE RESPONSE:', addEventError, addEventResponse);

      if(!addEventError){
        response.writeHead(200, {"Content-Type": "application/json"});
        response.write(JSON.stringify(addEventResponse, null, '\t'));
        response.end();
 
      }else{
          response.writeHead(500, {"Content-Type": "application/json"});
          response.write(JSON.stringify(addEventError, null, '\t'));
          response.end();
      }

    });
     
  };

  addGoogleEvent(accessToken);
});
app.post('/event', access_token, function(request, response){
 
  console.log('****** request *******' , request.body );
  var st = request.body.prefix__starttime__suffix || request.body.starttime;
  var et = request.body.prefix__endtime__suffix  || request.body.endtime; 
  var addEventBody = {
    'status':'confirmed',
    'summary': request.body.summary || 'Appointment',
    'description': request.body.description || 'n/a',
    'location': request.body.location || '',
    'organizer': {
      'email': request.session.email, //email
      'self': true
    },
    start : {},
    end: {},
    'attendees': [
        {
          'email': request.session.email,
          'organizer': true,
          'self': true,
          'responseStatus': 'needsAction'
        }
    ]
  };
  if(st){
    addEventBody.start.dateTime = (st ? request.body.startdate + "T" + st +"+07:00" : '');
  }else{
    addEventBody.start.date = request.body.startdate || "";
  }
  if(et){
    addEventBody.end.dateTime = (et ? request.body.enddate + "T" + et +"+07:00" : '');
  }else{
    addEventBody.end.date = request.body.enddate || "";
  }
  console.log('****** addEventBody.start.dateTime *******', addEventBody.start.dateTime );
     
  if(request.body.email){
    addEventBody.attendees.push({
          'email': request.body.email,
          'organizer': false,
          'responseStatus': 'needsAction'
        });
  }
  if (request.body.id){
    addEventBody['id'] = request.body.id;
  }
  var calendarId = request.body.calendarId || request.session.email;
  var eventId = request.body.eventId;
  var accessToken     = request.session.access_token;
  var addGoogleEvent = function(accessToken){
    //instantiate google calendar instance
    var google_calendar = new gcal.GoogleCalendar(accessToken);
    console.log('****** ADDING GOOGLE EVENT *******', calendarId, addEventBody, accessToken);
    if (eventId){
        google_calendar.events.update(calendarId, eventId, addEventBody, function(addEventError, addEventResponse){
          console.log('GOOGLE RESPONSE:', addEventError, addEventResponse);

          if(!addEventError){
            response.writeHead(200, {"Content-Type": "application/json"});
            response.write(JSON.stringify(addEventResponse, null, '\t'));
            response.end();
            //return response.redirect('/calendar');
            //return res.redirect('/calendar/'+calendarId+'/'+eventId);
          }else{
              response.writeHead(500, {"Content-Type": "application/json"});
              response.write(JSON.stringify(addEventError, null, '\t'));
              response.end();
          }

        });
    }else{
        google_calendar.events.insert(calendarId, addEventBody, function(addEventError, addEventResponse){
          console.log('GOOGLE RESPONSE:', addEventError, addEventResponse);

          if(!addEventError){
              //return response.redirect('/calendar');
              response.writeHead(200, {"Content-Type": "application/json"});
              response.write(JSON.stringify(addEventResponse, null, '\t'));
              response.end();
          }else{
              response.writeHead(500, {"Content-Type": "application/json"});
              response.write(JSON.stringify(addEventError, null, '\t'));
              response.end();
          }
          
          //return response.redirect('/calendar/'+calendarId+'/'+eventId+'/edit');
        });
    }
  };

  addGoogleEvent(accessToken);
});

app.all('/:calendarId/add', function(req, res){
  
  if(!req.session.access_token) return res.redirect('/auth');
  
  var accessToken     = req.session.access_token;
  var calendarId      = req.params.calendarId;

  console.log('************ add', req.query);
  var text            = req.query.text || 'Hello World';
  
  gcal(accessToken).events.quickAdd(calendarId, text, function(err, data) {
    if(err) return res.send(500,err);
    return res.redirect('/'+calendarId);
    //return res.redirect('/'+calendarId+'/'+eventId);
  });
});

app.all('/:calendarId/:eventId/update', function(req, res){
  
  if(!req.session.access_token) return res.redirect('/auth');
  
  var accessToken     = req.session.access_token;
  var calendarId      = req.params.calendarId;
  var eventId         = req.params.eventId;
  console.log('************ update', req.query);
  gcal(accessToken).events.get(calendarId, eventId, function(err, data) {
    if(err) return res.send(500,err);
    //return res.send(data);

    for(i in req.query){
      data[i] = req.query[i];
    }
    console.log('************ data', data);
  
    gcal(accessToken).events.update(calendarId, eventId, data , function(err, res_data) {
      if(err) return res.send(500,err);
      return res.redirect('/'+calendarId+'/'+eventId);
    });
  });
  
});

app.all('/:calendarId', function(req, res){
  
  if(!req.session.access_token) return res.redirect('/auth');
  
  var accessToken     = req.session.access_token;
  var calendarId      = req.params.calendarId;
  
  gcal(accessToken).events.list(calendarId, function(err, data) {
    if(err) return res.send(500,err);
    return res.send(data);
  });
});


app.all('/:calendarId/:eventId', function(req, res){
  
  if(!req.session.access_token) return res.redirect('/auth');
  
  //Create an instance from accessToken
  var accessToken     = req.session.access_token;
  var calendarId      = req.params.calendarId;
  var eventId         = req.params.eventId;
  
  gcal(accessToken).events.get(calendarId, eventId, function(err, data) {
    if(err) return res.send(500,err);
    return res.send(data);
  });
});
 
app.all('/:calendarId/:eventId/remove', function(req, res){
  
  if(!req.session.access_token) return res.redirect('/auth');
  
  var accessToken     = req.session.access_token;
  var calendarId      = req.params.calendarId;
  var eventId         = req.params.eventId;
  
  gcal(accessToken).events.delete(calendarId, eventId, function(err, data) {
    if(err) return res.send(500,err);
    return res.redirect('/'+calendarId);
  });
});


function getAccessToken(request){
  return request.session.access_token || null;
}
/******************************************************************************
 * Methods
 *****************************************************************************/
 

/*
  ===========================================================================
                               Google Calendar
  ===========================================================================
*/

app.get('/events', function(request, response){

  var getGoogleEvents = function(accessToken)
  {
    //instantiate google calendar instance
    var google_calendar = new gcal.GoogleCalendar(accessToken);

    google_calendar.events.list(googleUserId, {'timeMin': new Date().toISOString()}, function(err, eventList){
      if(err){
        response.send(500, err);
      }
      else{
        response.writeHead(200, {"Content-Type": "application/json"});
        response.write(JSON.stringify(eventList, null, '\t'));
        response.end();
      }
    });

    google_calendar.calendarList.list(function(err, calendarList) {
      console.log('****** calendarList *******' , err, calendarList );
  
      //google_calendar.events.list(calendarId, function(err, calendar ) {

      //  console.log('****** calendarId *******' , calendar );
  
      //});
    });
  };

  //retrieve current access token
  getAccessToken().then(function(accessToken){
    getGoogleEvents(accessToken);
  }, function(error){
    //TODO: handle getAccessToken error
  });

});
/*
app.get('/calendars', function(request, response){

  var getGoogleEvents = function(accessToken)
  {
    //instantiate google calendar instance
    var google_calendar = new gcal.GoogleCalendar(accessToken);
  
    google_calendar.calendarList.list(function(err, calendarList) {
      console.log('****** calendarList *******' , err, calendarList );
      if(err){
        response.send(500, err);
      }
      else{
        response.writeHead(200, {"Content-Type": "application/json"});
        response.write(JSON.stringify(calendarList, null, '\t'));
        response.end();
      }
      //google_calendar.events.list(calendarId, function(err, calendar ) {

      //  console.log('****** calendarId *******' , calendar );
  
      //});
    });
  };

  //retrieve current access token
  getAccessToken().then(function(accessToken){
    getGoogleEvents(accessToken);
  }, function(error){
    //TODO: handle getAccessToken error
  });

});

app.get('/calendar', function(request, response){
  var calendarId = request.query.calendarId;
  var getGoogleEvents = function(accessToken)
  {
    //instantiate google calendar instance
    var google_calendar = new gcal.GoogleCalendar(accessToken);
    
    google_calendar.events.list(calendarId, function(err, calendar ) {

      console.log('****** calendar ******* ' , calendarId , err, calendar );
      if(err){
        response.send(500, err);
      }
      else{
        response.writeHead(200, {"Content-Type": "application/json"});
        response.write(JSON.stringify(calendar, null, '\t'));
        response.end();
      }
       
    });
  };

  //retrieve current access token
  getAccessToken().then(function(accessToken){
    getGoogleEvents(accessToken);
  }, function(error){
    //TODO: handle getAccessToken error
  });

});
*/




var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});