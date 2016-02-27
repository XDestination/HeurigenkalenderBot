var _ = require('lodash');
var request = require('request');
var geocode = require('./geocode');

function HeurigenClient(config) {
  var that = this;
  
  this.telegram = config.telegram;
  
  this.db_client = config.db_client;
  this.allowed_cmds = [
    'searchloc', 'searchname'
  ];
  
  this.handleRequest = function(obj) {
    console.log("Received request: " + JSON.stringify(obj));
    if (!that.isValidRequest(obj)) {
      console.log("Invalid Request");
      return;
    }
    
    var update_id = that.getUpdateId(obj);
    var cache_key = 'UPDATE_ID#' + update_id;
    
    that.db_client.get(cache_key, function(resp) {
      console.log('Cache response: ' + resp);
      console.log(obj);
      if (resp === null) {
        console.log("Settings cache");
        that.db_client.set(cache_key, 1, function(success) {
          if (success) {
            that.db_client.expireat(cache_key, (new Date()).getTime()/1000 + 86400);
          }
        });
        console.log("Settings cache done");
        
        var chat_id = that.getChatId(obj);
        console.log("chat_id: " + chat_id);
        var message_id = that.getMessageId(obj);
        console.log("message_id: " + message_id);
        var key = that.getRequestKey(obj);
        console.log("key: " + key);
        var cmd = that.getRequestCmd(obj);
        console.log("cmd: " + JSON.stringify(cmd));
        
        if (cmd !== null) {
          switch (cmd.cmd) {
            case 'searchloc':
              that.handleSearchByLocation(key, chat_id, message_id, cmd.param.length ? cmd.param[0] : null);
              break;
            case 'searchname':
              if (cmd.param.length) {
                // ask for location
                that.respond(chat_id, "Please provide a location to look for (either by sending it as a message, or by picking it through the location-picker).", 
                  message_id, {force_reply: true, selective: true});
                  
                var value = {
                  cmd: cmd.cmd,
                  params: [cmd.param[1]]
                };
                that.db_client.set(key, JSON.stringify(value), function(success) {
                  that.db_client.expireat(key, (new Date()).getTime() / 1000 + 300);
                });
              } else {
                // ask for name to look for
                that.respond(chat_id, "Please provide a name to look for", 
                  message_id, {force_reply: true, selective: true});
                  
                var value = {
                  cmd: cmd.cmd,
                  params: []
                };
                that.db_client.set(key, JSON.stringify(value), function(success) {
                  that.db_client.expireat(key, (new Date()).getTime() / 1000 + 300);
                });
              }
              break;
            default:
              // respond with unknown cmd
              that.respond(chat_id, "You entered an unknown command!", message_id);
              
              // delete entry for key
              that.db_client.expireat(key, 0);
              break;
          }
        } else {
          var text = that.getRequestText(obj);
          var location = that.getRequestLocation(obj);
          
          console.log(that.db_client.storage);
          that.db_client.get(key, function(resp) {
            if (resp === null) {
              // respond with unknown cmd
              that.respond(chat_id, "Please enter a command first!", message_id);
              
              // delete entry for key
              that.db_client.expireat(key, 0);
            } else {
              var value = JSON.parse(resp);
              
              switch (value.cmd) {
                case 'searchloc':
                  if (_.isNull(location) && _.isNull(text)) {
                    that.respond(chat_id, "Please send the location either as a message or via the location-picker.", message_id);
                  } else {
                    console.log(location, text);
                    that.handleSearchByLocation(key, chat_id, message_id, !_.isNull(location) ? location : text);
                  }
                  break;
                case 'searchname':
                  if (value.params.length) {
                    // respond with typing
                    that.respondWaiting(chat_id, 'typing');
                    
                    // resolve location provided as param
                    
                    // request heurigens based on loc and name
                    
                    // respond with text
                    that.respond(chat_id, "1. Heuriger so und so\n2. Heuriger abs", message_id);
                    
                    // delete entry for key
                    that.db_client.expireat(key, 0);
                  } else {
                    // ask for location
                    that.respond(chat_id, "Please provide a location to look for", 
                      message_id, {force_reply: true, selective: true});
                    
                    value.params.push(text);
                    that.db_client.set(key, JSON.stringify(value), function(success) {
                      that.db_client.expireat(key, (new Date()).getTime() / 1000 + 300);
                    });
                  }
                  break;
              }
            }
          });
        }
      } else {
        console.log("Duplicate request: " + update_id);
      }
    });
  };
  
  this.isValidRequest = function(obj) {
    if (!_.isUndefined(obj.update_id) && !_.isUndefined(obj.message)) {
      return true;
    } else {
      return false;
    }
  };
  
  this.getUpdateId = function(obj) {
    return obj.update_id;
  };
  
  this.getChatId = function(obj) {
    return obj.message.chat.id;
  };
  
  this.getMessageId = function(obj) {
    return obj.message.message_id;
  };
  
  this.getRequestKey = function(obj) {
    return obj.message.from.id + '#' + obj.message.chat.id;
  };
  
  this.getRequestText = function(obj) {
    return _.isUndefined(obj.message.text) ? null : obj.message.text;
  };
  
  this.getRequestLocation = function(obj) {
    return _.isUndefined(obj.message.location) ? null : obj.message.location;
  };
  
  this.getRequestCmd = function(obj) {
    if (!_.isUndefined(obj.message.text)) {
      for (var i in that.allowed_cmds) {
        if (obj.message.text.match(new RegExp('^/' + that.allowed_cmds[i]))) {
          var cmd = that.allowed_cmds[i];
          var param = obj.message.text.indexOf(' ') >= 0 ? obj.message.text.substr(obj.message.text.indexOf(' ') + 1) : '';
          
          return {
            cmd: cmd,
            param: param
          };
        }
      } 
    }

    return null;
  };
  
  this.respondWaiting = function(chat_id, action) {
    var params = {
      chat_id: chat_id,
      action: action
    };
    
    console.log('Sending ChatAction "' + action + '"');
    that.postRequest('/sendChatAction', params, function(err, req, res) {
      if (err) {
        console.log('Sending ChatAction failed: ' + err);
      } else {
        console.log('Sending ChatAction succeeded:');
        console.log(res);
      }
    });
  };
  
  this.respond = function(chat_id, text, reply_to_message_id, reply_markup) {
    var params = {
      chat_id: chat_id,
      text: text
    };
    
    if (!_.isUndefined(reply_to_message_id)) {
      params.reply_to_message_id = reply_to_message_id;
    }
    if (!_.isUndefined(reply_markup)) {
      params.reply_markup = reply_markup;
    }
    
    console.log('Sending Request: ' + JSON.stringify(params));
    that.postRequest('/sendMessage', params, function(err, req, res) {
      if (err) {
        console.log('Sending Request failed: ' + err);
      } else {
        console.log('Sending Request succeeded:');
        console.log(res);
      }
    });
  };
  
  this.postRequest = function(path, params, cb) {
    var url = that.telegram.baseurl + '/bot' + that.telegram.token + path;
    request.post({url: url, body: params, json: true}, cb);
  };
  
  this.handleSearchByLocation = function(cache_key, chat_id, message_id, location) {
    console.log(cache_key, chat_id, message_id, location);
    if (!_.isNull(location)) {
      // respond with typing
      that.respondWaiting(chat_id, 'typing');
        
      if (_.isString(location)) {
        // resolve location provided as param
        geocode.geocode(location, function(res) {
          if (res.length) {
            console.log(res);
            that.returnHeurigenFromLocation(chat_id, message_id, {latitude: res[0].latitude, longitude: res[0].longitude});
          } else {
            that.respond(chat_id, "Can't convert location. Please send a location through the location-picker.", message_id);
          }
        });
      } else {
        that.returnHeurigenFromLocation(chat_id, message_id, location);
      }
    } else {
      // ask for location
      that.respond(chat_id, "Please provide a location to look for (either by sending it as a message, or by picking it through the location-picker).", 
        message_id, {force_reply: true, selective: true});
      
      var value = {
        cmd: 'searchloc',
        params: []
      };
      that.db_client.set(cache_key, JSON.stringify(value), function(success) {
        that.db_client.expireat(cache_key, (new Date()).getTime() / 1000 + 300);
      });
    }
  };
  
  this.returnHeurigenFromLocation = function(cache_key, chat_id, message_id, location) {
    // request heurigens
  
    // respond with text
    that.respond(chat_id, "1. Heuriger so und so\n2. Heuriger abs", message_id);
    
    // clear the cache
    that.db_client.expireat(cache_key, 0);
  };
  
  this.handleSearchByName = function() {
    
  };
}

var heurigen = {
  client: function(config) {
    return new HeurigenClient(config);
  }
};

module.exports = heurigen;
