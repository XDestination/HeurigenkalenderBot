var config = require('./config');

var geocoderProvider = 'google';
var httpAdapter = 'https';
var extra = {
    apiKey: config.google.api_key,
    formatter: null
};
 
var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);

module.exports = {
  gecode: function(string, callback) {
    console.log(string, callback);
    geocoder.geocode(string, callback);
  }
};
