const auth = require('../routes/auth').auth;
let mysql = require('../../models/mysql');
let express = require('express');
let path = require('path');
let router = express.Router();

router.use(express.static(path.join(__dirname, '../public')));

router.get('/:sessionId', auth, async (req, res, next) => {
    let db,db2;
    try {
        db = await mysql.query('SELECT `session_id`, `session_name`, `userid`, `interval`, `enabled` FROM log_sessions WHERE log_sessions.session_id = ?;', [req.params.sessionId]);
        db2 = await mysql.query('SELECT * FROM ??;', ['logsession_'+db.rows[0].session_id]);
    } catch(e) {
        return console.log(e);
    }
    if(db.rows.length < 1) return res.redirect('/');
    if(db.rows[0].userid !== req.session.user) return  res.redirect('/');
    let columns = [];
    let graphData = [];
    for(let i=0; i<db2.fields.length; i++) { //Get the column names
        if(db2.fields[i].name === 'row_id') continue;
        columns.push(db2.fields[i].name);
        let dataName = db2.fields[i].name;
        let series = {
            name: dataName,
            data: [],
            pointInterval: db.rows[0].interval
        };
        for(let j=0; j<db2.rows.length; j++) { //Get column data
            series.data.push(db2.rows[j][dataName]);
        }
        graphData.push(series);
    }
    let chartConfig = {
        interval: db.rows[0].interval,
        graphData
    };
    res.render('logging', {sessionName: db.rows[0].session_name, columns, chartConfig});
});

module.exports = router;