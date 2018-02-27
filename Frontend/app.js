const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const config = require('./config');
let mysql = require('./models/mysql');
mysql.start(config.mysql);

const index = require('./routes/index');
const auth = require('./routes/auth');
const api = require('./routes/api.js');
const app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(require('express-session')({ resave: false, saveUninitialized: false, secret: 'a secret' }));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth', auth.pages);
app.use('/api', api);
app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = config.env === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

process.on('uncaughtException', function(err) {
    console.log(`UNCAUGHT EXCEPTION | ${err.stack}`);
});

process.on('unhandledRejection', (err) => {
    console.log(`UNHANDLED REJECTION | ${err.stack}`);
});

module.exports = app;