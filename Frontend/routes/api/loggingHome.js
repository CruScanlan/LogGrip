let mysql = require('../../models/mysql');
let auth = require('../auth').auth;
let uuid = require('uuid/v4');
let express = require('express');
let router = express.Router();

router.post('/get-user-sessions', auth, async (req, res) => {
    let post = req.body;
    if(!req.session.user) return res.json({error:'no user'});

    let db;
    try {
        db = await mysql.query('SELECT `session_id`, `session_name`, `enabled` FROM `log_sessions` WHERE `userid` = ? AND `session_name` LIKE ?;', [req.session.user, `%${post.query}%`]);
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

router.post('/add-session', auth, async (req, res) => {
    let post = req.body;
    if(!req.session.user) return res.json({error:'no user'});
    if(!post.sessionName) return res.json({error:'no session name'});
    if(!post.sessionInterval) return res.json({error:'no session interval'});
    if(isNaN(post.sessionInterval)) return res.json({error:'session interval NaN'});
    if(!post.sessionColumns) return res.json({error:'no session columns'});
    let dataTypes = {
        Text: 'TEXT NOT NULL',
        Integer: 'INT(11) NOT NULL',
        Float: 'FLOAT(11) NOT NULL'
    };
    let types = Object.keys(dataTypes);
    for(let i=0; i<post.sessionColumns.length; i++) {
        if(!post.sessionColumns[i].columnName) return res.json({error:'no session column name'+(i+1)});
        if(!post.sessionColumns[i].columnType) return res.json({error:'no session column type'+(i+1)});
        if(!types.includes(post.sessionColumns[i].columnType)) return res.json({error:`data type of ${post.sessionColumns[i].columnType} does not exist, column ${i+1}`});
    }
    let sessionUUID = uuid();
    let query = 'SET autocommit = 0;START TRANSACTION;INSERT INTO `log_sessions`(session_id, session_name, userid, `interval`, enabled) VALUES (?, ?, ?, ?, 1); CREATE TABLE IF NOT EXISTS ?? (row_id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY';
    let inserts = [sessionUUID, post.sessionName, req.session.user, post.sessionInterval, 'logsession_'+sessionUUID];
    for(let i=0; i<post.sessionColumns.length; i++) {
        query += ', ?? '+dataTypes[post.sessionColumns[i].columnType];
        inserts.push(post.sessionColumns[i].columnName);
    }
    query += '); TRUNCATE ??; COMMIT;';
    inserts.push('logsession_'+sessionUUID);

    let db;
    try {
        db = await mysql.query(query, inserts);
    } catch(e) {
        res.json({success: false});
        return console.log(e);
    }

    res.json({success: true});
});

module.exports = router;

/*
INSERT INTO `logsession_ba89d3e2-675b-4161-b329-999ce696975f`(`light sensor`) VALUES (10);

SELECT * FROM `logsession_ba89d3e2-675b-4161-b329-999ce696975f`;

SET autocommit = 0;
START TRANSACTION;
INSERT INTO `log_sessions`(session_id, session_name, userid, `interval`, enabled) VALUES ('eeded077-53ae-4777-ae97-00e648dec886', 'this is a test', '01c8839c-dbd3-420d-9af8-b523b23a49b4', 10, 1);
CREATE TABLE IF NOT EXISTS `logsession_eeded077-53ae-4777-ae97-00e648dec886` (
  row_id INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `sesnor 1` INT(11)
);
TRUNCATE `logsession_eeded077-53ae-4777-ae97-00e648dec886`;
COMMIT;
 */