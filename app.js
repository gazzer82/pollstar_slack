var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var https = require('https');

var routes = require('./routes/index');
var users = require('./routes/users');

var request = require('request');
var google = require('google');
var fs = require('fs');
var cheerio = require('cheerio');
var parseString = require('xml2js').parseString;
var util = require('util');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use('/static', express.static('public'));

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

function sendSlackIncoming(dates, cities, venues, artist, user) {

    var fallback_text = artist + " dates are, "
    var dates_array = [];
    for (i = 0; i < dates.length; i++) {

        fallback_text = fallback_text + venues[i] + " - " + cities[i] + " - " + dates[i] + ", "

        var obj = {
            title: venues[i] + " - " + cities[i],
            value: dates[i]
        }
        dates_array.push(obj);
    }

    var options = {
        uri: "https://hooks.slack.com/services/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",
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'},
            json: {
                "channel" : "@" + user,
                "username": "Pollstar",
                "attachments": [
            {
                "fallback": fallback_text,
                "text": "Below are the current known dates for " + artist + " on Pollstar.",
                "fields": dates_array,
                "color": "#F35A00"
            }
        ]
            }
        };

        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(error)
            }
        });
}

function getDates (artistID, artist, user) {

            var request = require('request');
            var date = new Date();
            date.setDate(date.getDate()-1);
            console.log(date);
            var day = ('0' + date.getDate()).slice(-2)
            var month = ("0" + (date.getMonth() + 1)).slice(-2)
            var year = date.getFullYear(); 
            var formattedDate = month + "/" + day + "/" + year
            request.post({
              headers: {'content-type' : 'application/x-www-form-urlencoded'},
              url:     'http://data.pollstar.com/api/pollstar.asmx/ArtistEvents',
              body:    "apiKey=***REMOVED***&artistID=" + artistID.trim() + "&startDate=" + formattedDate.trim() + "&dayCount=365&page=0&pageSize=365"
            }, function(error, response, body){
                var cleanedBody = body.replace("\ufeff", "");
                parseString(cleanedBody, function (err, result) {
                    if(err){
                        console.log('Error Parsing Dates Response: ' + err);
                    } else {
                    var dates = [];
                    var region = [];
                    var venue = [];
                    var band = artist

                    for (var i = 0; i < result.ArtistInfo.Events[0].Event.length; i++) {
                        dates.push(result.ArtistInfo.Events[0].Event[i].$.PlayDate.trim().replace(/'/g, " ")),
                        region.push(result.ArtistInfo.Events[0].Event[i].$.Region.trim().replace(/'/g, " ")),
                        venue.push(result.ArtistInfo.Events[0].Event[i].$.VenueName.trim().replace(/'/g, " "))

                    }
                    sendSlackIncoming(dates, region, venue, band, user)
                }
                });
            });

}


app.post('/pollstar',function(req,res){
    if (req.body.token != "***REMOVED***"){

            console.log("User not autheticated");
            res.send("Sorry doesn't seem lilke you're on the up and up, no token!")

    } else if (!req.body.text || req.body.text == ""){

            console.log("No artist specified")
            res.send("Hey " + req.body.user_name + " you need to include a name!")

    } else {    

            console.log("Searching now for " + req.body.text);
            var bandID = undefined;
            var artists = ""
            var request = require('request');
            request.post({
              headers: {'content-type' : 'application/x-www-form-urlencoded'},
              url:     'http://data.pollstar.com/api/pollstar.asmx/Search',
              body:    "apiKey=***REMOVED***&searchText=" + req.body.text
            }, function(error, response, body){
                var cleanedBody = body.replace("\ufeff", "");
                parseString(cleanedBody, function (err, result) {
                    if (err){
                        console.log("Error parsing artist list respone: " + err);
                    } else {
                        if (result.SearchResults.Artists[0].Artist){    
                            for (var i = 0; i < result.SearchResults.Artists[0].Artist.length; i++) {
                                if (i < result.SearchResults.Artists[0].Artist.length - 1) {
                                    artists = artists + result.SearchResults.Artists[0].Artist[i].$.ListName + ", "
                                } else {
                                    artists = artists + result.SearchResults.Artists[0].Artist[i].$.ListName
                                }

                                if (result.SearchResults.Artists[0].Artist[i].$.ListName.toLowerCase() == req.body.text.toLowerCase()){
                                    console.log("Found it! - " + result.SearchResults.Artists[0].Artist[i].$.Url);
                                    bandID = result.SearchResults.Artists[0].Artist[i].$.ID
                                    break
                                }
                            }
                        }
                    }

                    if (bandID == undefined) {
                        if (artists == ""){
                            res.send("Sorry " + req.body.user_name + " couldn't find an artist matching " + req.body.text)
                        } else {
                            res.send("Sorry " + req.body.user_name + " couldn't find " + req.body.text + " where you looking for " + artists)
                        }

                    } else {

                        res.send("Ok " + req.body.user_name + " I've found " + req.body.text + " compiling dates, back shortly!")
                        getDates(bandID, req.body.text, req.body.user_name);

                    }
                });
            });

        }

});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
