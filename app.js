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
                "channel" : user,
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
            res.json({error: "no valid user token"})

    } else if (!req.body.text || req.body.text == ""){

            console.log("No artist specified")
            res.json({error: "no artist"})

    } else {
                google.resultsPerPage = 25
                var nextCounter = 0
                var band_url = undefined
                console.log("Searching now for " + req.body.text);
                google("pollstar " + req.body.text + " live dates", function (err, next, links){
                    if (err) {
                        console.error(err)
                        res.json({error: "no artist"})
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

                        res.json({error : "Artist Not Found"});

                    } else {

                        /*var options = {
                        uri: "https://api.import.io/store/data/b7eb19c1-ddf1-48d7-84df-063b8c0ebcc3/_query?_user=dde46b10-237e-476f-b1bb-b90be84e9996&_apikey=dde46b10-237e-476f-b1bb-b90be84e9996%3Anz8QTYhXG4dNQKI%2FEl3%2FtzQZSWMkPAQ0CC7MQn0tOhTrHTioM3gccDHweN%2FVHSMlsGyshxUmvlBmVfLmrOHG%2Bg%3D%3D",
                        method: 'POST',
                        headers: {
                        'Content-Type': 'application/json'},
                            json: {
                                "input": 
                                { 
                                    "webpage/url": band_url
                                }
                            }
                        };

                        request(options, function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                sendSlackIncoming(body, req.body.text, req.body.user_name);
                                res.send("Fetching now, back in a minute or so!")
                            } else {
                                res.json({error : error});
                            }

                        });*/
                            var dates = [];
                            var city = [];
                            var venue = [];
                            request(band_url, function(error, response, html){
                                if(!error){
                                    var $ = cheerio.load(html);

                                    $('.daydate').each(function(){
                                        var data = $(this);
                                        if (data.text().trim() != "" && data.text().trim() != "Date"){
                                            dates.push(data.text().trim())
                                        }
                                        //release = data.children().last().children().text();

                                        //json.title = title;
                                        //json.release = release;
                                    })

                                    $('.city').each(function(){
                                        var data = $(this);
                                        if (data.text().trim() != "" && data.text().trim() != "City"){
                                            city.push(data.text().trim())
                                        }
                                        //release = data.children().last().children().text();

                                        //json.title = title;
                                        //json.release = release;
                                    })

                                    $('.venue').each(function(){
                                        var data = $(this);
                                        if (data.text().trim() != "" && data.text().trim() != "Venue"){
                                            venue.push(data.text().trim())
                                        }
                                        //release = data.children().last().children().text();

                                        //json.title = title;
                                        //json.release = release;
                                    })

                                    sendSlackIncoming(dates, city, venue, req.body.text, req.body.channel_name);
                                    console.log("Sending to " + req.body.channel_name);
                                    res.send("Fetching now, back in a minute or so!")

                                } else {
                                    res.json({error : error});
                                }
                            })
                    }
                }

            })

    }
});


app.get('/scrape', function(req, res){
    if (!req.body.artist){

        res.json({error: "no artist"})

    } else {
    var url2 = build_url(req.body.artist);
    console.log(url2);
    var band_url = ""

    request(url2, function(error, response, html){
        if(!error){
        var $ = cheerio.load(html);


        $('.b_attribution').each(function(i, element){
            if (i == 0){
            var a = $(this).children().eq(0)
            band_url = a.text()
            if (band_url == "Ad"){
                a = $(this).children().eq(1)
                band_url = a.text()
            }
            band_url = "http://" + band_url
            //band_url = encodeURIComponent(band_url)
            console.log(band_url);
            };
        });

    }

    var options = {
        uri: "https://api.import.io/store/data/b7eb19c1-ddf1-48d7-84df-063b8c0ebcc3/_query?_user=dde46b10-237e-476f-b1bb-b90be84e9996&_apikey=dde46b10-237e-476f-b1bb-b90be84e9996%3Anz8QTYhXG4dNQKI%2FEl3%2FtzQZSWMkPAQ0CC7MQn0tOhTrHTioM3gccDHweN%2FVHSMlsGyshxUmvlBmVfLmrOHG%2Bg%3D%3D",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        json: {
            "input": 
                { "webpage/url": band_url 
            }
        }
    };

    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        //res.json(body);
      } else {
        //res.json({error : error});
      }

    });

    });
    }
})

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
