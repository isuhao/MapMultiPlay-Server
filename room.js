var _=require("underscore");

var global_room_id = _.random(1,10000000);

function Room(name,max,owner)
{
    this.id = global_room_id++;
    this.name = name;
    this.max = max;
    this.parts = [owner.id];
    this.owner = 0;
}

Room.prototype.join = function(user)
{
    this.parts.push(user.id);
}

Room.prototype.leave = function(user)
{
    var idx = _.indexOf(this.parts,user.id);
    if(idx >= 0)
    {
        this.parts.splice(idx,1);
    }
    if(idx == this.owner)
    {
        this.owner = 0;
    }
}

Room.prototype.setOwner = function(user)
{
    var index = 0;
    _.find(this.parts,function(u)
    {
        if(u == user.id)
        {
            return true;
        }
        index++;
        return false;
    });
    if(index < this.parts.length)
    {
        this.owner = index;
    }
}

Room.prototype.setOwnerIndex = function(index)
{
    if(index < this.parts.length)
    {
        this.owner = index;
    }
} 

Room.prototype.isEmpty = function()
{
    if(_.size(this.parts) == 0)
    {
        return true;
    }
    return false;
}

module.exports = Room;