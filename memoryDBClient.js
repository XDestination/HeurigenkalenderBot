var _ = require('lodash');

function Client() {
  var that = this;
  this.storage = {};
  
  this.get = function(key, cb) {
    console.log("Calling get: ", arguments);
    var ret = null;
  
    console.log("Storage: " + JSON.stringify(that.storage));
    console.log(!_.isUndefined(that.storage[key]));
    if (!_.isUndefined(that.storage[key])) {
    console.log(that.storage[key].expireAt === null);
    console.log(that.storage[key].expireAt < (new Date()).getTime() / 1000);
      if (that.storage[key].expireAt === null || that.storage[key].expireAt > (new Date()).getTime() / 1000) {
        ret = that.storage[key].value;
      }
    }
    
    if (!_.isUndefined(cb)) {
      cb(ret);
    }
  };
  
  this.set = function(key, value, cb) {
    console.log("Calling set: ", arguments);
    that.storage[key] = {
      value: value,
      expireAT: null
    };
    
    console.log("Storage: " + JSON.stringify(that.storage));
    if (!_.isUndefined(cb)) {
      cb(true);
    }
  };
  
  this.expireat = function(key, expireat) {
    console.log("Calling expireat: ", arguments);
    that.get(key, function(ret) {
      console.log("Cache Get response: " + ret);
      if (ret !== null) {
        that.storage[key].expireAt = expireat;
        console.log("Storage: " + JSON.stringify(that.storage));
      }
      else {console.log("NOT FOUND");}
    });
  };
  
  this.end = function() {};
}

module.exports = {
  client: function() {
    return new Client();
  }
};
