const config = require('../config.json');
let path = require('path');
let express = require('express');
let router = express.Router();

router.use(express.static(path.join(__dirname, '../public')));

/* GET home page. */
router.get('/login', function(req, res, next) {
    res.render('login', {error:{auth:false}});
});

router.post('/login', function (req, res) {
    if(req.body.user && req.body.password)  {
        if(req.body.user !== config.auth.user) return returnBadPass(res);
        if(req.body.password !== config.auth.password) return returnBadPass(res);

        req.session.user = config.auth.user;
        return res.redirect('/');
    }
    return returnBadPass(res);
});

router.get('/logout', auth, function(req, res, next) {
    delete req.session.user;
    req.user = null;
    res.redirect('/');
});

function auth(req, res, next) {
    if(!config.auth.enabled) return next();
    if (req.session && req.session.user === config.auth.user)
        return next();
    else
        return res.redirect('/auth/login');
}

function returnBadPass(res){
    res.render('login', {error:{auth:true}});
}

module.exports.pages = router;
module.exports.auth = auth;
