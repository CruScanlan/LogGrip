const auth = require('../routes/auth').auth;
let mysql = require('../models/mysql');
let express = require('express');
let path = require('path');
let router = express.Router();

router.use(express.static(path.join(__dirname, '../public')));

router.get('/:sessionId', auth, async (req, res, next) => {
    let db, db2;

    try {
        db = await mysql.query('SELECT log_sessions.session_name, log_sessions.user_id, log_sessions.`interval`, log_sessions_sensor_groups.visible, sensors.sensor_id, sensors.name AS sensor_name, log_sessions_sensor_groups.column_name, sensors.connected AS sensor_connected FROM sensors INNER JOIN log_sessions_sensor_groups ON sensors.sensor_id = log_sessions_sensor_groups.sensor_id INNER JOIN log_sessions ON log_sessions_sensor_groups.log_session_id = log_sessions.session_id WHERE log_session_id = ? ORDER BY sensor_name;', [req.params.sessionId]);
        db2 = await mysql.query('SET @cSensor = \'first\'; SELECT bResult.row_num * log_sessions.`interval` AS time, log_sessions_sensor_groups.column_name, sensors.name AS sensor_name, bResult.sensor_id, bResult.data FROM ( SELECT rowNumberForSensorID(aResult.sensor_id) AS row_num, aResult.row_id, aResult.session_id, aResult.sensor_id, aResult.data FROM ( SELECT log_session_data.row_id, log_session_data.session_id, log_session_data.sensor_id, log_session_data.data FROM log_session_data WHERE session_id = ? ORDER BY sensor_id ) AS aResult ORDER BY aResult.row_id ) AS bResult INNER JOIN log_sessions ON bResult.session_id = log_sessions.session_id INNER JOIN sensors ON bResult.sensor_id = sensors.sensor_id  INNER JOIN log_sessions_sensor_groups ON bResult.sensor_id = log_sessions_sensor_groups.sensor_id AND bResult.session_id = log_sessions_sensor_groups.log_session_id ORDER BY sensor_id, time;', [req.params.sessionId]);
    } catch(e) {
        return console.log(e);
    }
    if(db.rows.length < 1) return res.redirect('/');
    if(db.rows[0].user_id !== req.session.user) return  res.redirect('/');
    let columns = [];
    let graphData = [];
    //push column names and graph data objects with no data
    for(let i=0; i<db.rows.length; i++) {
        columns.push(db.rows[i].sensor_name);
        graphData.push({
            sensorName: db.rows[i].sensor_name,
            name: db.rows[i].column_name,
            id: db.rows[i].sensor_id,
            visible: db.rows[i].visible === 1 ,
            data: [],
            pointInterval: db.rows[i].interval
        });
    }

    for(let i=0; i<graphData.length; i++) {
        for(let j=0; j<db2.rows.length; j++) {
            if(db2.rows[j].sensor_id !== graphData[i].id) continue;
            graphData[i].data.push(db2.rows[j].data); //push data into the graph objects
        }
    }

    let tableDataObject = {};
    for(let i=0; i<db2.rows.length; i++) {
        if(!tableDataObject[db2.rows[i].time]) tableDataObject[db2.rows[i].time] = {};
        tableDataObject[db2.rows[i].time][db2.rows[i].column_name] = db2.rows[i].data;
    }

    let tableData = [];
    let times = Object.keys(tableDataObject);
    for(let i=0; i<times.length; i++) {
        let data = tableDataObject[times[i]];
        data.time = times[i];
        tableData.push(data);
    }

    let chartConfig = {
        interval: db.rows[0].interval,
        graphData
    };
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.render('logging', {sessionName: db.rows[0].session_name, columns, chartConfig, tableData, logSessionID: req.params.sessionId});
});

module.exports = router;