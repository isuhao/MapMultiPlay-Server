/* 
  Module dependencies:
  
  - Express
  - Http (to run Express)
  - Underscore (because it's cool)
  - Socket.IO
  
  It is a common practice to name the variables after the module name.
  Ex: http is the "http" module, express is the "express" module, etc.
  The only exception is Underscore, where we use, conveniently, an 
  underscore. Oh, and "socket.io" is simply called io. Seriously, the 
  rest should be named after its module name.

*/
var express = require("express");
var app = express();
var port = 8080;
 
var _ = require("underscore");

var io = require('socket.io').listen(app.listen(port));
console.log("Listening on port " + port);

//Specify where the static content is
app.use(express.static("public", __dirname + "/public"));

//Tells server to support JSON, urlencoded, and multipart requests
// app.use(express.bodyParser());

/* Server routing */

//Handle route "GET /", as in "http://localhost:8080/"
app.get("/debug", function(request, response) {

  //Render the view called "index"
  response.send("hello!");

});

var io_handlers = require("./io_handlers");

/* Socket.IO events */
io.on("connection", function(socket){
  console.log("new connection");
  
  _.each(io_handlers.handlers,function(value, key)
  {
    console.log("    [io] listen:"+key);
    socket.on(key,function(data)
    {
        console.log("    [io] event:"+key);
        value(data,{'socket':socket, 'io': io});
    });

  });
});

var intervalId = setInterval(function()
  {
    console.log("broadcast loc");
    io_handlers.broadcast_loc(io);
  },3000);