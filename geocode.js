var config = require('./config');

var geocoderProvider = 'google';
var httpAdapter = 'http';
// optionnal 
var extra = {
    apiKey: config.google.api_key,
    formatter: null
};
 
var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);

module.exports = {
  gecode: function(string, callback) {
    gecoder.geocode(string, callback);
  }
};
