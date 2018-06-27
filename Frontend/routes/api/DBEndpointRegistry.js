const EventEmitter = require('events');
let auth = require('../auth').auth;

class EndpointRegistry extends EventEmitter {
    constructor(router, mysql) {
        super();

        if(!router) throw new Error(`router was not defined`);
        if(!mysql) throw new Error(`mysql was not defined`);
        if(typeof mysql !== 'object') throw new TypeError(`mysql was not of type object`);

        /**
         * The mysql client for the registry
         */
        Object.defineProperty(this, 'mysql', {value: mysql});

        /**
         * The express server for the registry
         */
        Object.defineProperty(this, 'router', {value: router});

        /**
         * Have the endpoints been registered?
         * @type {boolean}
         */
        this._endpointsRegistered = false;
    }

    registerEndpoints(endpoints) {
        if(this._endpointsRegistered) throw new Error(`endpoints have already been registered`);
        if(!this.mysql._started) throw new Error(`mysql has not been started`);
        for(let i=0; i<endpoints.length; i++) {
            this._registerEndpoint(endpoints[i]);
        }
        this._endpointsRegistered = true;
    }

    _registerEndpoint(endpoint) {
        this.verifyEndpointData(endpoint);
        this.router.post(`/db/${endpoint.name}`, auth, async (req, res) => {
            if(!req.body.queryParams) return res.json({success: false, error: `queryParams was not defined`});
            if(typeof req.body.queryParams !== "object") return res.json({success: false, error: `queryParams was not of type object`});
            let reqQueryParamKeys = Object.keys(req.body.queryParams);
            let endpointQueryParamkeys = Object.keys(endpoint.queryParams);
            for(let i=0; i<endpointQueryParamkeys.length; i++) {
                if(!reqQueryParamKeys.includes(endpointQueryParamkeys[i])) return res.json({success: false, error: `${endpointQueryParamkeys[i]} was not defined in the request`});
                if(typeof req.body.queryParams[endpointQueryParamkeys[i]] !== endpoint.queryParams[endpointQueryParamkeys[i]]) return res.json({success: false, error: `${reqQueryParamKeys[i]} was not of type ${endpoint.queryParams[endpointQueryParamkeys[i]]}`});
            }
            let {sql, inserts} = endpoint.queryConstructor(req.body.queryParams || null, req.session || null);
            let dbRes;
            try {
                dbRes = await this.mysql.query(sql, inserts);
            } catch(e) {
                console.error(e);
                return res.status(500).json({success: false});
                //TODO: Deal with this error
            }
            if(!endpoint.doesReturn) return res.json({success: true});
            let response;
            if(endpoint.infoParser) {
                response = endpoint.infoParser(dbRes);
            }   else {
                response = {rows: dbRes.rows};
            }
            response.success = true;
            return res.json(response);
        });
    }

    verifyEndpointData(endpoint) {
        if(!endpoint) throw new Error(`endpoint was not not defined`);
        if(typeof endpoint !== 'object') throw new TypeError(`endpoint was not of type object`);
        if(!endpoint.name) throw new Error(`endpoint.name was not defined`);
        if(typeof endpoint.name !== 'string') throw TypeError(`endpoint.name was not of type string`);
        if(!endpoint.queryParams) throw new Error(`endpoint.queryParams was not defined`);
        if(typeof endpoint.queryParams !== 'object') throw new TypeError(`endpoint.queryParams was not of type object`);
        let queryParamKeys = Object.keys(endpoint.queryParams);
        for(let i=0; i<queryParamKeys.length; i++) {
            if(typeof endpoint.queryParams[queryParamKeys[i]] !== 'string') throw new TypeError(`endpoint.queryParams.${queryParamKeys[i]} is not of type string`);
            if(endpoint.queryParams[queryParamKeys[i]] === 'string') continue;
            if(endpoint.queryParams[queryParamKeys[i]] === 'number') continue;
            throw new Error(`endpoint.queryParams.${queryParamKeys[i]} does not have a string value of "string" or "number"`);
        }
        if(endpoint.doesReturn === undefined) throw new Error(`endpoint.doesReturn was not defined`); //undefined because boolean
        if(typeof endpoint.doesReturn !== 'boolean') throw new TypeError(`endpoint.doesReturn was not of type boolean`);
        if(endpoint.doesReturn) {
            if(endpoint.infoParser) {
                if(typeof endpoint.infoParser !== 'function') throw new TypeError(`endpoint.infoParser was not of type function`);
            }
        }
        if(!endpoint.queryConstructor) throw new Error(`endpoint.queryConstructor was not defined`);
        if(typeof endpoint.queryConstructor !== 'function') throw new TypeError(`endpoint.constructor was not of type function`);
    }
}

module.exports = EndpointRegistry;