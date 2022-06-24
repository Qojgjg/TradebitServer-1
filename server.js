// import package
import express from 'express';
import passport from 'passport';
import morgan from 'morgan';
import cors from 'cors';
import http from 'http'
import https from 'https'
import bodyParser from 'body-parser';
// const users = require('./routes/api/users');
// const helpcenter = require('./routes/api/helpcenter')
// const newsletter = require('./routes/api/newsletter');
// const trade = require('./routes/api/trade');
// const spottrade = require('./routes/api/spottrade');
// const Admincontroller = require('./routes/api/Admincontroller');

// const frontusers = require('./routes/cryptoapi/frontusers');
// const support = require('./routes/cryptoapi/support');
// const support_bk = require('./routes/api/support_bk');
// const fronttrade = require('./routes/cryptoapi/fronttrade');
// const frontspottrade = require('./routes/cryptoapi/frontspottrade');
// const homepage = require('./routes/cryptoapi/homepage');
// const frontreferral = require('./routes/cryptoapi/frontreferral')
// const frontassets = require('./routes/cryptoapi/frontassets')
// const ethereumHelper = require('./routes/cryptoapi/ethereumHelper');
// const launchpad = require('./routes/api/launchpad');
// import config
import config from './config';
import dbConnection from './config/dbConnection';
import { createSocketIO } from './config/socketIO';
import './config/cron';

// import routes
import adminApi from './routes/admin.route';
import userApi from './routes/user.route';
import testApi from './routes/test.route';

// import controller
import * as priceCNVCtrl from './controllers/priceCNV.controller';

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';


const app = express();
app.use(morgan("dev"))
app.use(cors());

var ip = require('ip');
var fs = require('fs');
var myip = ip.address();

console.log(myip, 'ip');


app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.use(passport.initialize());

// include passport stratagy
require("./config/passport").usersAuth(passport)
require("./config/passport").adminAuth(passport)

app.use(express.static(__dirname + '/public'));

// coin
app.get('/test', (req, res) => {
  console.log('successfully')
})


app.use('/adminApi', adminApi)
app.use('/api', userApi)
app.use('/testApi', testApi)

// only apply to requests that begin with /api/
// app.use("/cryptoapi/", apiLimiter);
// // app.use('/api', users);
// app.use('/api', Admincontroller);
// app.use('/api', newsletter);
// app.use('/api', support);
// app.use('/api', trade);
// app.use('/api', helpcenter);
// app.use('/api', spottrade);
// app.use('/api', launchpad)
// //frontend
// app.use('/cryptoapi', frontusers);
// app.use('/cryptoapi', fronttrade);
// app.use('/cryptoapi', frontspottrade);
// app.use('/cryptoapi', homepage);
// app.use('/cryptoapi', frontreferral)
// app.use('/cryptoapi', frontassets)

// const RateLimit = require("express-rate-limit");
// const RedisStore = require("rate-limit-redis");

// const limiter = new RateLimit({
//   store: new RedisStore({
//     // see Configuration
//   }),
//   max: 5, // limit each IP to 100 requests per windowMs
//   delayMs: 0, // disable delaying - full speed until the max limit is reached
// });

// app.get('/testAPI', limiter, (req, res) => {
//   return res.send("Successfully Testing")
// })


app.get('/testAPI', (req, res) => {
  return res.send("Successfully Testing")
})


if (myip == '128.199.24.190') {
  const options = {
    key: fs.readFileSync('/etc/ssl/bitbaazi/start.bitbaazi.com.key'),
    cert: fs.readFileSync('/etc/ssl/bitbaazi/start.bitbaazi.com.crt')
  };
  var server = https.createServer(options, app);
}
else {
  var server = http.createServer(app);
}




app.get('/', function (req, res) {
  res.json({ status: true });
});

createSocketIO(server)

// DATABASE CONNECTION
dbConnection((done) => {
  if (done) {
    server = server.listen(config.PORT, function () {
      console.log('\x1b[34m%s\x1b[0m', `server is running on port ${config.PORT}`);
    });
  }
})

