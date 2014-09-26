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
  
  _.each(io_handlers,function(value, key)
  {
    socket.on(key,function(data)
    {
        value(data,{'socket':socket, 'io': io});
    });
  });
  /* 
    When a client disconnects from the server, the event "disconnect" is automatically 
    captured by the server. It will then emit an event called "userDisconnected" to 
    all participants with the id of the client that disconnected
  */
  socket.on("disconnect", function() {
    participants = _.without(participants,_.findWhere(participants, {id: socket.id}));
    io.sockets.emit("userDisconnected", {id: socket.id, sender:"system"});
  });

});