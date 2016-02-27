var _ = require('lodash');

function Client() {
  this.storage = {};
  
  this.get = function(key, cb) {
    console.log("Calling get: ", arguments);
    var ret = null;
  
    if (!_.isUndefined(this.storage[key])) {
      if (this.storage[key].expireAt === null || this.storage[key].expireAt < (new Date()).getTime() / 1000) {
        ret = this.storage[key].value;
      }
    }
    
    if (!_.isUndefined(cb)) {
      cb(ret);
    }
  };
  
  this.set = function(key, value, cb) {
    console.log("Calling set: ", arguments);
    this.storage[key] = {
      value: value,
      expireAT: null
    };
    
    console.log("Storage: " + JSON.stringify(this.storage));
    if (!_.isUndefined(cb)) {
      cb(true);
    }
  };
  
  this.expireat = function(key, expireat) {
    console.log("Calling expireat: ", arguments);
    this.get(key, function(ret) {
      if (ret !== null) {
        this.storage[key].expireAt = expireat;
      }
    });
  };
  
  this.end = function() {};
}

module.exports = {
  client: function() {
    return new Client();
  }
};
