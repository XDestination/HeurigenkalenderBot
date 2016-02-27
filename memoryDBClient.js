var _ = require('lodash');

function Client() {
  this.storage = {};
  
  this.get = function(key, cb) {
    var ret = null;
  
    if (!_.isUndefined(this.storage[key])) {
      if (this.storage[key].expireAt === null || this.storage[key].expireAt < (new Date()).getTime() / 1000) {
        ret = this.storage[key].value;
      }
    }
    
    if (!.isUndefined(cb)) {
      cb(ret);
    }
  };
  
  this.set = function(key, value, cb) {
    this.storage[key] = {
      value: value,
      expireAT: null
    };
    
    if (!.isUndefined(cb)) {
      cb(true);
    }
    console.log("Storage: " + this.storage);
  };
  
  this.expireat = function(key, expireat) {
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
