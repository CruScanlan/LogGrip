let express = require('express');
let router = express.Router();
let mysql = require('../models/mysql');

const loggingHome = require('./api/loggingHome');
const EndpointRegistry = require('./api/EndpointRegistry');
const dbEndpoints = require('../endpoints');

router.use('/logging-home', loggingHome);

router.get('/', (req, res) => {
    res.end('API Running!')
});

let endpointsRegistry = new EndpointRegistry(router, mysql);
endpointsRegistry.registerEndpoints(dbEndpoints);

module.exports = router;