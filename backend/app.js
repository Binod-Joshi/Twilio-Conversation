require('dotenv').config();

// Node/Express
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');

const router = require('./src/router');

// Create Express webapp
const app = express();
app.use(cors());

// Add body parser for Notify device registration
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(router);

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  console.trace(err);
  res.status(err.status || 500);
  res.send({
    message: err.message,
    error: {},
  });
});


// Create http server and run it
const server = http.createServer(app);
const port = process.env.PORT || 5000;
server.listen(port, function() {
  console.log('Express server running on *:' + port);
});

module.exports = app;
