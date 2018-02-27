let express = require('express');
let router = express.Router();

const loggingHome = require('./api/loggingHome');

router.use('/logging-home', loggingHome);

router.get('/', (req, res) => {
    res.end('API Running!')
});

module.exports = router;