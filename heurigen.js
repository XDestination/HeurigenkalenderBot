
function HeurigenClient(config) {
  this.rest_client = config.rest_client;
  this.db_client = config.db_client;
  
  this.handleRequest = function(obj) {
    if (!this.isValidRequest(obj)) {
      return;
    }
  };
  
  this.isValidRequest = function(obj) {
    return false;
  };
}

var heurigen = {
  client: function(config) {
    return new HeurigenClient(config);
  }
};

module.exports = heurigen;
