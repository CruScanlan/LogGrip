module.exports = [
    {
        name: "get-user-sessions",
        requestType: "post",
        doesReturn: true,
        queryParams: {
            query: "string"
        },
        queryConstructor: (queryParams, session) => {
            return {
                sql: 'SELECT `session_id`, `session_name` FROM `log_sessions` WHERE `user_id` = ? AND `session_name` LIKE ?;',
                inserts: [session.user, `%${queryParams.query}%`]
            }
        },
        infoParser: (dbRes) => {
            let response = {sessions:[]};
            for(let i=0; i<dbRes.rows.length; i++) {
                response.sessions.push({
                    session_id: dbRes.rows[i].session_id,
                    session_name: dbRes.rows[i].session_name
                })
            }
            return response;
        }
    },
    {
        name: "update-sensor-visibility",
        requestType: "post",
        doesReturn: false,
        queryParams: {
            sensorID: "string",
            sessionID: "string",
            visible: "number"
        },
        queryConstructor: (queryParams, session) => {
            return {
                sql: 'UPDATE log_sessions_sensor_groups as sensorGroups SET sensorGroups.visible = ? WHERE sensorGroups.sensor_id = ? AND sensorGroups.log_session_id = ? AND ( SELECT user_id FROM log_sessions WHERE log_sessions.session_id = ? ) = ?;',
                inserts: [queryParams.visible, queryParams.sensorID, queryParams.sessionID, queryParams.sessionID, session.user]
            }
        }
    }
];