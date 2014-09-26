var io_events = require("./events");
var User = require("./user");
var Room = require("./room");
var _ = require("underscore");

var PLACEHOLDER = "";

var io_handlers = {};

var users = {}; //id:User

var user_sessions = {};//session:id

var free_users = {};//id: PLACEHOLDER

var rooms = {}; //room id : Room

var roomsByName = {}; //name : room id

function getSessionId(context)
{
    return context.socket.id;
}

io_handlers[io_events.EVENT_USER_SIGNIN] = function(data,context)
{
}

io_handlers[io_events.EVENT_USER_SIGNUP] = function(data,context)
{

}

io_handlers[io_events.EVENT_USER_TRIAL] = function(data,context)
{
    //FIXME we only support trial users for now. 
    var u = new User(data.name,true,0,getSessionId(context));
    users[u.id] = u;
    free_users[u.id] = PLACEHOLDER;
    user_sessions[getSessionId(context)] = u.id ;//FIXME session id?
    //FIXME emit socket io event
}

io_handlers[io_events.EVENT_ROOM_CREATE] = function(data,context)
{
    var sessionid = getSessionId(context);
    var userid = user_sessions[sessionid];
    if(_.has(free_users,userid))
    {
        if(!_.has(roomsByName,data.name))
        {
            var user = users[userid];
            var r = new Room(data.name,data.max,user); 
            rooms[r.id] = r;
            roomsByName[r.name] = r.id;
            delete free_users[userid];
            context.socket.join(r.name);
            context.socket.emit(io_events.EVENT_ROOM_CREATE,r);
        }
        else
        {
            //exceptional case       
        }
    }
    else
    {
        //exceptional case
    }
}

io_handlers[io_events.EVENT_ROOM_JOIN] = function(data,context)
{
    var sessionid = getSessionId(context);
    var userid = user_sessions[sessionid];
    if(_.has(free_users,userid))
    {
        var user = users[userid];
        var r = rooms[data.id];
        r.join(user);
        user.setRoomID(r.id);
        delete free_users[userid];
        context.socket.join(r.name);
        context.socket.emit(io_events.EVENT_ROOM_JOIN,r);
        context.socket.broadcast.to(r.name).emit(io_events.EVENT_ROOM_PARTICIPANTS_CHANGE,r);
    }
    else
    {
        //exceptional case
    }
}

io_handlers[io_events.EVENT_ROOM_LEAVE] = function(data,context)
{
    var sessionid = getSessionId(context);
    var userid = user_sessions[sessionid];
    if(_.has(rooms,data.id))
    {
        var user = users[userid];
        var r = rooms[data.id];
        r.leave(user);
        user.setRoomID(0);
        context.socket.leave(r.name);
        free_users[user.id] = PLACEHOLDER;
        context.socket.emit(io_events.EVENT_ROOM_LEAVE,{});
        if(r.isEmpty())
        {
            delete roomsByName[r.name];
            delete rooms[r.id];
        }
        else
        {
            context.socket.broadcast.to(r.name).emit(io_events.EVENT_ROOM_PARTICIPANTS_CHANGE,r);
        }
    }
    else
    {
        //exceptional case
    }
}

io_handlers[io_events.EVENT_ROOM_FIND_BY_NAME] = function(data,context)
{
    var room_id = roomsByName[data];
    var r = rooms[room_id];

    // room.
}

module_exports=io_handlers;