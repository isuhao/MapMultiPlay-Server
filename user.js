var _=require("underscore");

var global_user_id = _.random(1,10000000);

function User(name,trial,gender,sessionid)
{
    this.name = name;
    this.trial = trial;
    this.gender = gender;
    this.id = global_user_id++;
    this.room_id = 0;
    this.session_id = sessionid;
}

User.prototype.setLocation = function(loc)
{
    this.loc = loc;
}

User.prototype.setRoomID = function(room_id)
{
    this.room_id = room_id;
}

module.exports = User;