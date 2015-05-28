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

    //console.log(dataArray);
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
                "text": "Below are the current known dates for " + artist + " on Pollstar, first page only!",
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

app.post('/pollstar',function(req,res){
    if (req.body.token != "***REMOVED***"){

            console.log("User not autheticated");
            res.send("Sorry doesn't seem lilke you're on the up and up, no token!")

    } else if (!req.body.text || req.body.text == ""){

            console.log("No artist specified")
            res.send("Hey " + req.body.user_name + " you need to include a name!")

    } else {
                google.resultsPerPage = 25
                var nextCounter = 0
                var band_url = undefined
                console.log("Searching now for " + req.body.text);
                google("pollstar " + req.body.text + " live dates", function (err, next, links){
                    if (err) {
                        console.error(err)
                        res.send("Sorry " + req.body.user_name + " couldn't find that artist")
                        return
                    } else {
                      for (var i = 0; i < links.length; ++i) {

                        if (links[i].link){
                            if (links[i].link.indexOf("http://www.pollstar.com/resultsArtist.aspx?ID=") == 0){
                                console.log("Found It - " + links[i].link);
                                band_url = links[i].link
                                break
                            }
                        }
                      }

                    console.log(band_url);

                    if (band_url == undefined) {

                        res.send("Sorry " + req.body.user_name + " couldn't find " + req.body.text)

                    } else {

                            var dates = [];
                            var city = [];
                            var venue = [];
                            res.send("Ok " + req.body.user_name + " I've found " + req.body.text + " compiling dates, back shortly!")
                            request(band_url, function(error, response, html){
                                if(!error){
                                    var $ = cheerio.load(html);

                                    $('.daydate').each(function(){
                                        var data = $(this);
                                        if (data.text().trim() != "" && data.text().trim() != "Date"){
                                            dates.push(data.text().trim())
                                        }
                                    })

                                    $('.city').each(function(){
                                        var data = $(this);
                                        if (data.text().trim() != "" && data.text().trim() != "City"){
                                            city.push(data.text().trim())
                                        }
                                    })

                                    $('.venue').each(function(){
                                        var data = $(this);
                                        if (data.text().trim() != "" && data.text().trim() != "Venue"){
                                            venue.push(data.text().trim())
                                        }

                                    })

                                    sendSlackIncoming(dates, city, venue, req.body.text, req.body.user_name);
                                    console.log("Sending to " + req.body.channel_name);

                                } else {
                                    res.json({error : error});
                                }
                            })
                    }
                }

            })

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
