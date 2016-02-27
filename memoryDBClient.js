var _ = require('lodash');

function Client() {
  var that = this;
  this.storage = {};
  
  this.get = function(key, cb) {
    var ret = null;
    
    that.cleanup();
  
    if (!_.isUndefined(that.storage[key])) {
      if (that.storage[key].expireAt === null || that.storage[key].expireAt > (new Date()).getTime() / 1000) {
        ret = that.storage[key].value;
      }
    }
    
    if (!_.isUndefined(cb)) {
      cb(ret);
    }
  };
  
  this.set = function(key, value, cb) {
    that.storage[key] = {
      value: value,
      expireAt: null
    };
    
    if (!_.isUndefined(cb)) {
      cb(true);
    }
  };
  
  this.expireat = function(key, expireAt) {
    that.get(key, function(ret) {
      if (ret !== null) {
        that.storage[key].expireAt = expireAt;
      }
    });
  };
  
  this.cleanup = function() {
    if (Math.random() * 1000 < 50) {
      for (var key in that.storage) {
        if (!_.isNull(that.storage[key].expireAt) && !_.isUndefined(that.storage[key].expireAt) && (new Date()).getTime() / 1000 > that.storage[key].expireAt) {
          delete that.storage[key];
        }
      }
    }
  };
  
  this.end = function() {};
}

module.exports = {
  client: function() {
    return new Client();
  }
};
