let mysql = require('../../models/mysql');
let auth = require('../auth').auth;
let uuid = require('uuid/v4');
let express = require('express');
let router = express.Router();

router.post('/add-session', auth, async (req, res) => {
    let post = req.body;
    if(!req.session.user) return res.json({success: false, error:'no user'});
    if(!post.sessionName) return res.json({success: false, error:'no session name'});
    if(!post.sessionInterval) return res.json({success: false, error:'no session interval'});
    if(isNaN(post.sessionInterval)) return res.json({success: false, error:'session interval NaN'});
    if(!post.sessionColumns) return res.json({success: false, error:'no session columns'});
    for(let i=0; i<post.sessionColumns.length; i++) {
        if(!post.sessionColumns[i].columnName) return res.json({success: false, error:'no session column name'+(i+1)});
        if(!post.sessionColumns[i].columnSensorID) return res.json({success: false, error:'no session column sensor'+(i+1)});
    }
    //TODO: Add error checking for string lengths
    let sessionUUID = uuid();

    let sensorsInsert = "";
    let inserts = [sessionUUID, post.sessionName, req.session.user, post.sessionInterval];
    for(let i=0; i<post.sessionColumns.length; i++) {
        sensorsInsert += " INSERT INTO log_sessions_sensor_groups(log_session_id, sensor_id, column_name) VALUES(?, ?, ?);";
        inserts.push(sessionUUID, post.sessionColumns[i].columnSensorID, post.sessionColumns[i].columnName);
    }
    let query = `SET autocommit=0; START TRANSACTION; INSERT INTO log_sessions(session_id, session_name, user_id, \`interval\`) VALUES(?, ?, ?, ?); ${sensorsInsert} COMMIT;`;

    try {
        await mysql.query(query, inserts);
    } catch(e) {
        res.json({success: false});
        return console.log(e);
    }
    res.json({success: true});
});

module.exports = router;