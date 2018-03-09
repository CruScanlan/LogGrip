let SerialPort = require('./serial');
let config = require('../config.json');
let serial = new SerialPort(config.serialPortOptions);
serial.on('data', (data) => {
    console.log(data);
});
