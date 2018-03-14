let SerialPort = require('./src/models/serial');
let config = require('../config.json');
let serial = new SerialPort(config.serialPortOptions);
serial.on('data', (data) => {
    console.log(data);
});

serial.on('open', (port) => {
    console.log(port);
});

serial.on('close', (port) => {
    console.log(port);
});