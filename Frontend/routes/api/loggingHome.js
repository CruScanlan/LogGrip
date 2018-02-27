let mysql = require('../../models/mysql');
let auth = require('../auth').auth;
let express = require('express');
let router = express.Router();

router.post('/get-user-sessions', auth, async (req, res) => {
    let post = req.body;
    if(!req.session.user) return res.json({error:'no user'});

    let db;
    try {
        db = await mysql.query('SELECT `session_id`, `session_name`, `enabled` FROM `log_sessions` WHERE `userid` IN (SELECT `userid` FROM `users` WHERE `users`.`user` = ?) AND `session_name` LIKE ?;', [req.session.user, `%${post.query}%`]);
    } catch(e) {
        return console.log(e);
    }

    let response = {sessions:[]};
    for(let i=0; i<db.rows.length; i++) {
        response.sessions.push({
            session_id: db.rows[i].session_id,
            session_name: db.rows[i].session_name,
            enabled: db.rows[i].enabled
        })
    }

    res.json(response);
});

module.exports = router;