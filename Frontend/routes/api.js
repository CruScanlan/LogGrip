let express = require('express');
let router = express.Router();
let mysql = require('../models/mysql');

const loggingHome = require('./api/loggingHome');
const loggingSession = require('./api/loggingSession');
const DBEndpointRegistry = require('./api/DBEndpointRegistry');
const dbEndpoints = require('../DBEndpoints');

router.use('/logging-home', loggingHome);
router.use('/logging-session', loggingSession);

router.get('/', (req, res) => {
    res.end('API Running!')
});

let dBEndpointsRegistry = new DBEndpointRegistry(router, mysql);
dBEndpointsRegistry.registerEndpoints(dbEndpoints);

module.exports = router;