const auth = require('../routes/auth').auth;
let express = require('express');
let router = express.Router();

/* GET home page. */
router.get('/', auth, function(req, res, next) {
    res.render('index');
});

module.exports = router;
