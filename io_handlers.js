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

function transformRoomObject(room)
{
    var r = {
        'id':room.id,
        'name':room.name,
        'max':room.max,
        'owner':room.owner,
        'parts':[]
    }
    _.each(room.parts,function(id)
    {
        r.parts.push(users[id]);

    });
    return r;
}

function broadcastLocation(io)
{
    _.each(rooms,function(room)
    {
        var locs = {};
        _.each(room.parts,function(uid)
        {
            var user = users[uid]
            if (user.loc) 
            {
                locs[uid] = user.loc;
            };
        });
        io.sockets.in(room.name).emit(io_events.EVENT_SYNC_LOCATION,locs);
    });
}

io_handlers[io_events.EVENT_PUBLISH_LOCATION] = function(data,context)
{
    var sid = getSessionId(context);
    var uid = user_sessions[sid];
    if (uid) {
        var user = users[uid];
        user.setLocation(data);
    };
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
    context.socket.emit(io_events.EVENT_USER_TRIAL,u);
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
            user.setRoomID(r.id);
            delete free_users[userid];
            context.socket.join(r.name);
            var rObj = transformRoomObject(r);
            context.socket.emit(io_events.EVENT_ROOM_CREATE,rObj);
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
        var rObj = transformRoomObject(r);
        context.socket.emit(io_events.EVENT_ROOM_JOIN,rObj);
        context.socket.broadcast.to(r.name).emit(io_events.EVENT_ROOM_PARTICIPANTS_CHANGE,rObj);
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
            var rObj = transformRoomObject(r);
            context.socket.broadcast.to(r.name).emit(io_events.EVENT_ROOM_PARTICIPANTS_CHANGE,rObj);
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
    if (room_id) {
        var r = rooms[room_id];
        var rObj = transformRoomObject(r);
        context.socket.emit(io_events.EVENT_ROOM_FIND_BY_NAME, rObj);
    }
    else
    {
        context.socket.emit(io_events.EVENT_ERROR, {'event':io_events.EVENT_ROOM_FIND_BY_NAME,"message":"no rooms found." });
    }
    // room.
}

io_handlers["disconnect"] = function(data,context)
{
    var sessionid = getSessionId(context);
    var userid = user_sessions[sessionid];
    if (userid) {
        var user = users[userid];
        if (user.room_id) {
            io_handlers[io_events.EVENT_ROOM_LEAVE] ({'id':user.room_id},context);
        };
        delete free_users[userid];
        delete user_sessions[sessionid];
        delete users[userid];
    };
    console.log('remain rooms:' + _.size(rooms) + ", remain users:" + _.size(users));
}

exports.handlers=io_handlers;
exports.broadcast_loc= broadcastLocation;