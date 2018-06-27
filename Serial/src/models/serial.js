let EventEmitter = require('events');
let serialPort = require('serialport');

/**
 * Class for accessing serial data from the esp8266
 */
class Serial extends EventEmitter {
    constructor(options) {
        super();
        /**
         * The loaded ports
         * @type {Array<SerialPort>}
         */
        this.loadedPorts = [];

        /**
         * All ESP ports
         * @type {Array}
         */
        this.ports = [];

        /**
         * The loaded port parsers (Use to read the loaded ports)
         * @type {Array<ReadLineParser>}
         */
        this.parsers = [];

        /**
         * The packet structure for the incoming data
         * @type {Array}
         */
        this.packetStructure = options.packetStructure || [];

        /**
         * The chip names that can be used
         * @type {Array}
         */
        this.chipNames = options.chipNames || [];

        /**
         * If auto port detection has started
         * @type {boolean}
         * @private
         */
        this._autoDetectingPorts = false;

        /**
         * Start auto detecting ports
         */
        this._startAutoDetect();
    }

    /**
     * Adds a port to be read by the data event
     * @param comName
     */
    readPort(comName) {
        for(let i=0; i<this.parsers.length; i++) {
            if(this.parsers[i].comName !== comName) continue;
            let parser = this.parsers[i];
            parser.on('data', (data) => {
                console.log(data);
                /*
                let dataPoints = data.split(',');
                let packet = {};
                for(let j=0; j<dataPoints.length; j++) {
                    packet[this.packetStructure[j]] = dataPoints[j];
                }
                this.emit('data', packet);
                */
            });
            parser.once('data', (data) => {
                /*
                let dataPoints = data.split(',');
                let packet = {};
                for(let j=0; j<dataPoints.length; j++) {
                    packet[this.packetStructure[j]] = dataPoints[j];
                }
                for(let j=0; j<this.loadedPorts.length; j++) {
                    if(this.loadedPorts[j].path !== this.parsers[i].comName) continue;
                    this.loadedPorts[j].chipId = packet.chipId;
                }
                this.parsers[i].chipId = packet.chipId;
                */
            })
        }
    }

    /**
     * Writes data to an open port in utf8
     * @param comName
     * @param data
     * @returns {Promise<void>}
     */
    async writePort(comName, data) {
        for(let i=0; i<this.loadedPorts.length; i++) {
            if(this.loadedPorts[i].path !== comName) continue;
            if(!this.loadedPorts[i].isOpen) await this.openPort(comName);
            this.loadedPorts[i].write(data, 'utf8');
        }
    }

    /**
     * Opens a port with comName and adds it to the parsers
     * @param comName
     * @returns {Promise<void|err>}
     */
    async openPort(comName) {
        return new Promise(async (resolve, reject) => {
            for(let i=0; i<this.loadedPorts.length; i++) {
                if(this.loadedPorts[i].path !== comName) continue;
                if(this.loadedPorts[i].isOpen) return reject("Port is already open");
                return this.loadedPorts[i].open((e) => {
                    if(e) return reject(new Error(e));
                    let parser = this.loadedPorts[i].pipe(new serialPort.parsers.Readline({ delimiter: '\r\n' }));
                    parser.comName = comName;
                    this.parsers.push(parser);
                    return resolve();
                });
            }
            return reject("Port does not exist!");
        });
    }

    /**
     * Gets all the names or paths of loaded ports
     * @returns {Array}
     */
    getPortNames() {
        let ports = [];
        for(let i=0; i<this.loadedPorts.length; i++) {
            ports.push(this.loadedPorts[i].path);
        }
        return ports;
    }

    /**
     * Auto detects ports - loads, opens, reads and removes automatically
     * @private
     */
    _startAutoDetect() {
        if(this._autoDetectingPorts) return;
        this._autoDetectingPorts = true;
        setInterval(() => {
            serialPort.list(async (err, ports) => {
                if(err) return console.log(new Error(err)); //TODO: deal with error
                let espPorts = []; //all esp board ports
                for(let i=0; i<ports.length; i++) {
                    if(this.chipNames.includes(ports[i].manufacturer)) {
                        espPorts.push(ports[i]);
                    }
                }

                let loadedPortIds = []; //get loaded port ids
                for(let i=0; i<this.ports.length; i++) {
                    loadedPortIds.push(this.ports[i].pnpId);
                }

                let newPorts = []; //grab any new port ids
                let cPortIds = []; //current port ids
                for(let i=0; i<espPorts.length; i++) {
                    cPortIds.push(espPorts[i].pnpId);
                    if(!loadedPortIds.includes(espPorts[i].pnpId)) newPorts.push(espPorts[i]);
                }

                let oldPorts = []; //grab any old ports
                for(let i=0; i<this.ports.length; i++) {
                    if(!cPortIds.includes(this.ports[i].pnpId)) oldPorts.push(this.ports[i]);
                }

                this.ports = espPorts;
                for(let i=0; i<newPorts.length; i++) { //add the new ports
                    this.loadedPorts.push(new serialPort(newPorts[i].comName, {baudRate: 921600, autoOpen:false}));
                    try {
                        await this.openPort(newPorts[i].comName); //open new port
                    } catch(e) {
                        return console.log(e); //TODO: deal with error
                    }
                    this.readPort(newPorts[i].comName); //read the new port
                    this.emit('open', {
                        comName: newPorts[i].comName,
                    })
                }

                //remove all old ports
                for(let i=0; i<oldPorts.length; i++) {
                    let chipId = null;
                    for(let j=0; j<this.loadedPorts.length; j++) { //remove old loaded ports
                        if(oldPorts[i].comName === this.loadedPorts[j].path) {
                            chipId = this.loadedPorts[j].chipId;
                            this.loadedPorts.splice(j, 1);
                        }
                    }
                    for(let j=0; j<this.parsers.length; j++) { //remove old parsers
                        if(oldPorts[i].comName === this.parsers[j].comName) {
                            this.parsers.splice(j, 1);
                        }
                    }
                    this.emit('close', {
                        comName: oldPorts[i].comName,
                        chipId
                    });
                }
            });
        },100)
    }
}

module.exports = Serial;