var restify = require('restify');
var fs = require('fs');
var request = require('request');

var config = require('./config');
var heurigen = require('./heurigen');
var memory_db_client = require('./memoryDBClient');

// init the heurigen client
var heurigen_client = heurigen.client({
  telegram: config.telegram,
  db_client: memory_db_client.client()
});

function updatewebhook(set_webhook) {
  var url = config.telegram.baseurl + '/bot' + config.telegram.token + '/setWebhook';
  var certificate = {
    value:  fs.readFileSync(config.certpath + '/' + config.domain + '.pem'),
    options: {
      filename: config.domain + '.pem',
      contentType: 'application/x-pem-file'
    }
  };
  var formdata = {
    url: set_webhook ? 'https://' + config.domain + '/webhook/' + config.telegram.token : '',
    certificate: set_webhook ? certificate : ''
  };
  
  console.log(formdata);
  
  var req = request.post({url: url, formData: formdata}, function (err, resp, body) {
    if (err) {
      if (set_webhook) {
        console.log('Setting the Webhook failed');
      } else {
        console.log('Unsetting the Webhook failed');
      }
      console.log(err);
    } else {
      if (set_webhook) {
        console.log('Setting the Webhook succeeded');
      } else {
        console.log('Unsetting the Webhook succeeded');
      }
      console.log(body);
    }
  });
}

// setup the server that receives the webhooks
var server = restify.createServer({
  name: config.app,
  version: config.version,
  certificate: fs.readFileSync(config.certpath + '/' + config.domain + '.pem'),
  key: fs.readFileSync(config.certpath + '/' + config.domain + '.key'),
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());
 
server.post('/webhook/' + config.telegram.token, function (req, res, next) {
  console.log(JSON.stringify(req.body));
  
  // handle the request
  heurigen_client.handleRequest(req.body);
  
  // ack the request
  res.send(200);
  return next();
});
 
server.listen(config.port, function () {
  console.log('%s listening at %s', server.name, server.url);
  console.log('Waiting for posts to "%s"', 'https://' + config.domain + '/webhook/' + config.telegram.token);
  
  // setup the webhook
  updatewebhook(true);
});

server.on('close', function() {
  console.log('Stopping ...');
  
  // unregister webhook
  updatewebhook(false);
});

// handle killing of server
process.on('SIGINT', function() {
  server.close();
});
