var express = require('express');
var fs = require('fs');
var router = express.Router();
var request = require('request');
var cheerio = require('cheerio');

function get_id (artist) {
	var url_part_1 = "https://api.import.io/store/data/eff3a023-8a72-4150-8308-999e1846e4e3/_query?input/webpage/url=http%3A%2F%2Fwww.bing.com%2Fsearch%3Fq%3Dpollstar"
	var url_part_2 = "%26qs%3Dn%26form%3DQBLH%26pq%3Dpollstar"
	var url_part_3 = "%26sc%3D1-22%26sp%3D-1%26sk%3D%26cvid%3D2071d8d31b484c7a9393b25c61b53cf0&_user=dde46b10-237e-476f-b1bb-b90be84e9996&_apikey=dde46b10-237e-476f-b1bb-b90be84e9996%3Anz8QTYhXG4dNQKI%2FEl3%2FtzQZSWMkPAQ0CC7MQn0tOhTrHTioM3gccDHweN%2FVHSMlsGyshxUmvlBmVfLmrOHG%2Bg%3D%3D"
	var url_seperator = "%2B"
	var url_artist = ""
	var url = ""
	var words = artist.split(" ")
	for (var i in words){
    	url_artist = url_artist + url_seperator + words[i];
    	console.log(words[i]);          
    };
    //return url = url_part_1 + url_artist + url_part_2 + url_artist + url_part_3;
    console.log(decodeURIComponent("http%3A%2F%2Fwww.bing.com%2Fsearch%3Fq%3Dpollstar%2Bkings%2Bof%2Bleon%26qs%3Dn%26form%3DQBLH%26pq%3Dpollstar%2Bkings%2Bof%2Bleon%26sc%3D1-22%26sp%3D-1%26sk%3D%26cvid%3D2071d8d31b484c7a9393b25c61b53cf0"));
    return (encodeURIComponent("http://www.bing.com/search?q=pollstar+kings+of+leon&qs=n&form=QBLH&pq=pollstar+kings+of+leon&sc=1-22&sp=-1&sk=&cvid=2071d8d31b484c7a9393b25c61b53cf0"));
}

function build_url (artist) {
	var url_part_1 = "http://www.bing.com/search?q=pollstar"
	//+kings+of+leon
	var url_part_2 = "&go=Submit&qs=n&form=QBRE&pq=pollstar+kings+of+leon&sc=1-22&sp=-1&sk=&cvid=9083b7c01a144d70be197ba0069bdbb1"
	var url = ""
	var words = artist.split(" ")
	for (var i in words){
    	url_artist = "+" + words[i];        
    };

    //console.log(url);
    return url;
}


/* GET home page. */
router.get('/', function(req, res, next) {
	var response = get_id("Coldplay")

    url = build_url("Kings of Leon");

    request(url, function(error, response, html){
    		console.log(url);
        if(!error){
        	console.log("No Error");
            var $ = cheerio.load(html);

            var title, release, rating;
            var json = { title : "", release : "", rating : ""};

            // We'll use the unique header class as a starting point.

            $('.header').filter(function(){

           // Let's store the data we filter into a variable so we can easily see what's going on.

                var data = $(this);

           // In examining the DOM we notice that the title rests within the first child element of the header tag. 
           // Utilizing jQuery we can easily navigate and get the text by writing the following code:

                title = data.children().first().text();

           // Once we have our title, we'll store it to the our json object.

                json.title = title;

                console.log(data);

            })
        } else {
        	console.log(error);
        	res.json({ Error: error});
        }
	})
	//res.json({ URL: response });  
});

module.exports = router;
