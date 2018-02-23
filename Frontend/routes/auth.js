const config = require('../config.json');
const path = require('path');
const express = require('express');
const bcrypt = require('bcrypt');
const uuid = require('uuid/v4');
let mysql = require('../models/mysql');
const router = express.Router();

router.use(express.static(path.join(__dirname, '../public')));

let auth = (req, res, next) => {
    if(!config.auth.enabled) return next();
    if (req.session && req.session.user)
        return next();
    else
        return res.redirect('/auth/login');
};

let returnBadLoginPass = (res) => {
    res.render('login', {error:{pass:true}});
};

let checkPassword = async (password, hash) => {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, hash, (err, matched) => {
            if(err) return reject(new Error(`Error when checking password hash | ${hash} | ${err}`));
            return resolve(matched);
        });
    });
};

let hashPassword = async (password) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, function(err, hash) {
            if(err) return reject(new Error(`Error when hashing password | ${err}`));
            return resolve(hash);
        });
    });
};

/* GET home page. */
router.get('/login', (req, res, next) => {
    res.render('login', {error:{pass:false}});
});

router.get('/register',(req, res, next) => {
    res.render('register', {error:{fill:false, repeatpass:false}});
});

router.post('/login', async (req, res) => {
    if(req.body.user && req.body.password)  {
        let db, matched;
        try {
            db = await mysql.query('SELECT * FROM `users` WHERE `users`.`user` = ?', [req.body.user]);
            if(!db.rows[0]) return returnBadLoginPass(res);
            matched = await checkPassword(req.body.password, db.rows[0].pass);
        } catch(e) {
            return console.log(e);
        }
        if(!db.rows[0]) return returnBadLoginPass(res);

        if(matched) {
            req.session.user = req.body.user;
            return res.redirect('/');
        }
        return returnBadLoginPass(res);
    }
    return returnBadLoginPass(res);
});

router.post('/register', async (req, res) => {
    if (req.body.username && req.body.password && req.body.passwordRepeat) {
        if(req.body.password !== req.body.passwordRepeat) return res.render('register', {error:{fill:false, repeatpass:true, userexists:false}});

        let hash;
        try {
            hash = await hashPassword(req.body.password);
        } catch(e) {
            return console.log(e);
        }

        let db;
        try{
            db = await mysql.query('INSERT INTO `users` (`userid`, `admin`, `user`, `pass`) VALUES (?, ?, ?, ?)', [uuid(), 0, req.body.username, hash]);
        } catch(e) {
            if(e.message.indexOf('ER_DUP_ENTRY') !== -1) return res.render('register', {error:{fill:false, repeatpass:false, userexists:true}});
            return console.log(e);
        }

        req.session.user = req.body.username;
        return res.redirect('/');
    }
    return res.render('register', {error:{fill:true, repeatpass:false, userexists:false}});
});

router.get('/logout', auth, (req, res, next) => {
    delete req.session.user;
    req.user = null;
    res.redirect('/');
});

module.exports.pages = router;
module.exports.auth = auth;