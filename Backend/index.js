let SerialPort = require('./serial');
let serial = new SerialPort;

let test = async () => {
    serial.on('data', (data) => {
        console.log(data);
    })
};

test();
