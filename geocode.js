var config = require('./config');

var geocoderProvider = 'google';
var httpAdapter = 'https';
var extra = {
    apiKey: config.google.api_key,
    formatter: null
};
 
var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);

module.exports = {
  geocode: function(string, callback) {
    geocoder.geocode(string, callback);
  }
};
