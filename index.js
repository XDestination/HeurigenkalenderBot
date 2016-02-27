var restify = require('restify');
var fs = require('fs');

var config = require('./config');


var server = restify.createServer({
  name: config.app,
  version: config.version,
  certificate: fs.readFileSync(config.certpath + '/' + config.domain + '.pem'),
  key: fs.readFileSync(config.certpath + '/' + config.domain + '.key'),
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());
 
server.get('/echo/:name', function (req, res, next) {
  res.json(200, req.params);
  return next();
});
 
server.listen(config.port, function () {
  console.log('%s listening at %s', server.name, server.url);
});
