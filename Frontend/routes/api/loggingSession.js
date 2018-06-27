let mysql = require('../../models/mysql');
let auth = require('../auth').auth;
let express = require('express');
let router = express.Router();

router.post('/delete-session', auth, async (req, res) => {
    let post = req.body;
    if(!post.sessionID) return res.json({success: false, error:'no session id'});
    if(typeof post.sessionID !== 'string') return res.json({success: false, error:'session id is not of type string'});
    let db;
    try {
        db = await mysql.query("SELECT * FROM `log_sessions` WHERE user_id = ? AND session_id = ?;", [req.session.user, post.sessionID]);
    } catch(e) {
        res.json({success: false});
        return console.log(e);
    }
    if(db.rows.length < 1) return res.json({success: false, error: "session id does not exist for that user"});
    try {
        await mysql.query('SET AUTOCOMMIT = 0; START TRANSACTION; DELETE FROM log_session_data WHERE session_id = ?; DELETE FROM log_sessions_sensor_groups WHERE log_session_id = ?; DELETE FROM log_sessions WHERE session_id = ?; COMMIT;', [post.sessionID, post.sessionID, post.sessionID]);
    } catch(e) {
        res.json({success: false});
        return console.log(e);
    }
    res.json({success: true});
});

module.exports = router;