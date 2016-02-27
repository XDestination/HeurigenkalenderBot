var _ = require('lodash');

function HeurigenClient(config) {
  this.rest_client = config.rest_client;
  this.db_client = config.db_client;
  this.allowed_cmds = [
    'searchloc', 'searchname'
  ];
  
  this.handleRequest = function(obj) {
    console.log("Received request: " + JSON.stringify(obj));
    if (!this.isValidRequest(obj)) {
      console.log("Invalid Request");
      return;
    }
    
    var update_id = this.getUpdateId(obj);
    var cache_key = 'UPDATE_ID#' + update_id;
    
    this.db_client.get(cache_key, function(resp) {
      console.log('Cache response: ' + resp);
      if (resp === null) {
        this.db_client.set(cache_key, 1);
        this.db_client.expireat(cache_key, (new Date()).getTime()/1000 + 86400);
        
        var chat_id = this.getChatId(obj);
        var message_id = this.getMessageId(obj);
        var key = this.getRequestKey(obj);
        var cmd = this.getRequestCmd(obj);
        
        console.log("chat_id: " + chat_id);
        console.log("message_id: " + message_id);
        console.log("key: " + key);
        console.log("cmd: " + cmd);
        
        if (cmd !== null) {
          switch (cmd.cmd) {
            case 'searchloc':
              if (cmd.param.length) {
                // respond with typing
                this.respondWaiting(chat_id, 'typing');
                
                // resolve location provided as param
                
                // request heurigens
                
                // respond with text
              } else {
                // ask for location
                this.respond(chat_id, "Please provide a location to look for", message_id, {force_reply: true, selective: true});
                
                var obj = {};
                this.db_client.set(key, JSON.stringify());
                this.db_client.expireat(key, (new Date()).getTime() / 1000 + 300);
              }
              break;
            case 'searchname':
              if (cmd.param.length) {
                // ask for location
                this.respond(chat_id, "Please provide a location to look for", message_id, {force_reply: true, selective: true});
              } else {
                // ask for name to look for
                this.respond(chat_id, "Please provide a name to look for", message_id, {force_reply: true, selective: true});
              }
              break;
            default:
              // respond with unknown cmd
              this.respond(chat_id, "You entered an unknown command!", message_id);
              
              // delete entry for key
              this.db_client.expireat(key, 0);
              break;
          }
        } else {
          console.log("TODO");
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
  
  this.getRequestCmd = function(obj) {
    if (!_.isUndefined(obj.message.text)) {
      for (var i in this.allowed_cmds) {
        if (obj.message.text.match(new RegExp('^/' + this.allowed_cmds[i]))) {
          var cmd = this.allowed_cmds[i];
          var param = obj.message.text.substr(obj.message.text.indexOf(' ')+1);
          
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
    this.rest_client.post('/sendChatAction', params, function(err, req, res) {
      if (err) {
        console.log('Sending ChatAction failed: ' + err);
      } else {
        console.log('Sending ChatAction succeeded: ' + res);
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
    this.rest_client.post('/sendMessage', params, function(err, req, res) {
      if (err) {
        console.log('Sending Request failed: ' + err);
      } else {
        console.log('Sending Request succeeded: ' + res);
      }
    });
  };
}

var heurigen = {
  client: function(config) {
    return new HeurigenClient(config);
  }
};

module.exports = heurigen;
