var storage = {};

module.exports = {
  get: function(key, cb) {
    var ret = null;
  
    if (tyoeof storage[key] !== 'undefined') {
      if (storage[key].expireAt === null || storage[key].expireAt < (new Date()).getTime() / 1000) {
        ret = storage[key].value;
      }
    }
    
    cb(ret);
  },
  set: function(key, value, cb) {
    storage[key] = {
      value: value,
      expireAT: null
    };
    
    cb(true);
  },
  expireat: function(key, expireat) {
    this.get(key, function(ret) {
      if (ret !== null) {
        storage[key].expireAt = expireat;
      }
    });
  },
  end: function() {}
};
