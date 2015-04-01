var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var growl = require('growl');
var rsj = require('rsj');
var feedUrls = [{title:'BBC top stories',image:'http://getreal/images/bbc.png',url:'http://feeds.bbci.co.uk/news/rss.xml'},{title:'BBC world news',image:'http://getreal/images/bbc.png',url:'http://feeds.bbci.co.uk/news/world/rss.xml'},{title:'BBC UK news',image:'http://getreal/images/bbc.png',url:'http://feeds.bbci.co.uk/news/uk/rss.xml'},{title:'BBC tech news',image:'http://getreal/images/bbc.png',url:'http://feeds.bbci.co.uk/news/technology/rss.xml'},{title:'HUKD',image:'http://getreal/images/hukd.jpg',url:'http://hotukdeals.com/rss/kandipr'},{title:'Hacker news',image:'http://getreal/images/hn.png',url:'http://hnapp.com/rss?q=type%3Ashow%20score%3E%3D0'}]


var app = express();

//Creating server
var http = require('http');
var server = http.createServer(app);
var sio = require('socket.io').listen(server); 
server.listen(3002);
//ends

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

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


var sock;
sio.on('connection',function(socket){
sock = socket;
            // console.log("socket ---> "  + sock);
getfeed(sock);

});



function feedgrowl(feed,sock,oldHeadline) {
 rsj.r2j(feed.url,function(json) { 

         posts = JSON.parse(json)
         var headLine =  posts[0].title;

          // console.log(JSON.stringify(posts[0]));

         if (feed.title === 'Hacker news')
         {
            headLine = headLine.slice(1);
         }

         var feedItem = {
            title:posts[0].title,
            pubDate:posts[0].pubDate,
            link:posts[0].link,
            logo:feed.image
         } ;

         // console.log(" feed item -->"+JSON.stringify(feedItem));

         if (oldHeadline != headLine)
         {
             // console.log("new feed item --> " +feed.title + '   <-->  '+ headLine);
            // growl(headLine,{title:feed.title,image:feed.image});
            // console.log("socket ---> "  + sock);
            if (sock)
            {

                sock.emit('data',{post:feedItem});    
            }
            
         }
         setTimeout(function(){feedgrowl(feed,sock,headLine)},60000);         
    });
}

function getfeed(sock){
    for (var i=0;i<feedUrls.length;i++)
    {
        feedgrowl(feedUrls[i],sock);
    }   
};



module.exports = app;