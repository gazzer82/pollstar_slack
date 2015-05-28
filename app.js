var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var https = require('https');

var routes = require('./routes/index');
var users = require('./routes/users');

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var google = require('google');

var app = express();

/*function build_url (artist) {

    var url_part_1 = "http://www.bing.com/search?q=pollstar"
    //+kings+of+leon
    var url_part_2 = "&go=Submit&qs=n&form=QBRE&pq=pollstar"
    //+kings+of+leon
    var url_part_3 = "&sc=1-22&sp=-1&sk=&cvid=9083b7c01a144d70be197ba0069bdbb1"

    var url_artist = ""
    var words = artist.split(" ")
    console.log(words);
    for (var i in words){
        url_artist = url_artist + "+" + words[i] + "+tour+dates"        
    };
    var url = url_part_1 + url_artist + url_part_2 + url_artist + url_part_3
    //console.log(url);
    return url;
}*/

function build_url (artist) {
    
    var url_part_1 = "https://www.google.com/#q="
    var url_artist = ""
    var words = artist.split(" ")
    console.log(words);
    for (var i in words){
        url_artist = url_artist + "+" + words[i] + "+tour+dates"        
    };
    var url = url_part_1 + url_artist
    //console.log(url);
    return url;
}

function search_google (artist) {
    google.resultsPerPage = 25
    var nextCounter = 0
    google("pollstar " + artist + " live dates", function (err, next, links){
      if (err) console.error(err)

      for (var i = 0; i < links.length; ++i) {
        //console.log(links[i].title + ' - ' + links[i].link) // link.href is an alias for link.link
        //console.log(links[i].description + "\n")
        if (links[i].link){
            if (links[i].link.indexOf("http://www.pollstar.com/resultsArtist.aspx?ID=") == 0){
                console.log("Found It - " + links[i].link);
                return links[i].link
            }
        }
      }

      //return undefined

      if (nextCounter < 4) {
        nextCounter += 1
        if (next) next()
      }
    })
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

app.post('/pollstar',function(req,res){
    if (!req.body.artist){
            console.log(req.body)
            res.json({error: "no artist"})

    } else {

                google.resultsPerPage = 25
                var nextCounter = 0
                var band_url = undefined
                google("pollstar " + req.body.artist + " live dates", function (err, next, links){
                  if (err) console.error(err)
                    console.log("Searching now for " + req.body.artist);
                  for (var i = 0; i < links.length; ++i) {
                    //console.log(links[i].title + ' - ' + links[i].link) // link.href is an alias for link.link
                    //console.log(links[i].description + "\n")
                    if (links[i].link){
                        if (links[i].link.indexOf("http://www.pollstar.com/resultsArtist.aspx?ID=") == 0){
                            console.log("Found It - " + links[i].link);
                            band_url = links[i].link

                            /*var options = {
                                uri: "https://api.import.io/store/data/b7eb19c1-ddf1-48d7-84df-063b8c0ebcc3/_query?_user=dde46b10-237e-476f-b1bb-b90be84e9996&_apikey=dde46b10-237e-476f-b1bb-b90be84e9996%3Anz8QTYhXG4dNQKI%2FEl3%2FtzQZSWMkPAQ0CC7MQn0tOhTrHTioM3gccDHweN%2FVHSMlsGyshxUmvlBmVfLmrOHG%2Bg%3D%3D",
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                json: {
                                    "input": 
                                        { "webpage/url": band_url }
                                }
                            };

                            request(options, function (error, response, body) {
                              if (!error && response.statusCode == 200) {
                                res.json(body);
                              } else {
                                res.json({error : error});
                              }

                            });*/

                            break
                        }
                    }
                  }

                  //return undefined

                  //if (nextCounter < 4) {
                  //  nextCounter += 1
                  //  if (next) next()
                  //}

                console.log(band_url);

                if (band_url == undefined) {

                    res.json({error : "Artist Not Found"});

                } else {

                    var options = {
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
                            res.json(body);
                        } else {
                            res.json({error : error});
                        }

                    });
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
        res.json(body);
      } else {
        res.json({error : error});
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
