module.exports = [
    {
        name: "get-user-sessions",
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
    },
    {
        name: "get-available-sensors",
        doesReturn: true,
        queryParams: {
        },
        queryConstructor: () => {
            return {
                sql: 'SELECT boards.board_id, boards.name AS board_name, sensors.sensor_id, sensors.name AS sensor_name FROM boards INNER JOIN sensors ON boards.board_id = sensors.board_id WHERE sensors.connected = 1 AND boards.connected = 1 AND boards.logging = 0;',
                inserts: []
            }
        },
        infoParser: (dbRes) => {
            let boards = [];
            for(let i=0; i<dbRes.rows.length; i++) {
                let board = boards.findIndex((board) => board.id === dbRes.rows[i].board_id); //check if board is already in array
                if(board !== -1) { //board is in array
                    boards[board].sensors.push({id: dbRes.rows[i].sensor_id, name: dbRes.rows[i].sensor_name}); //add sensor to board
                    continue;
                }
                boards.push({ //add board and sensor
                    id: dbRes.rows[i].board_id,
                    name: dbRes.rows[i].board_name,
                    sensors: [
                        {
                            id: dbRes.rows[i].sensor_id,
                            name: dbRes.rows[i].sensor_name
                        }
                    ]
                })
            }
            return {boards};
        }
    }
];