"use strict";
const onemitter_1 = require("onemitter");
const IO = require("sails.io.js");
const SailsClient = require("socket.io-client");
class Client {
    constructor(config) {
        this.config = config;
        this.io = IO(SailsClient);
        this.io.sails.url = config.address;
    }
    request(q, vars) {
        return new Promise((resolve, reject) => {
            this.io.socket.request({
                data: { query: q, vars },
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                method: "POST",
                url: this.config.path,
            }, (body, jwr) => {
                if (jwr.statusCode !== 200) {
                    reject("Invalid request, status code " + jwr.statusCode + ", response" + jwr.toString());
                    return;
                }
                const data = JSON.parse(body);
                if (data.errors) {
                    reject("Errors: " + JSON.stringify(data.errors));
                    return;
                }
                resolve(data.data);
            });
        });
    }
    watchRequest(q, vars, opts) {
        opts = opts || {};
        opts.pollingTimeout = opts.pollingTimeout || 10000;
        const o = onemitter_1.default();
        this._watchTick(q, vars, o, opts.pollingTimeout);
        return o;
    }
    _watchTick(query, vars, onemitter, timeout) {
        this.request(query, vars).then((result) => {
            onemitter(result);
        }).catch((e) => {
            console.error(e);
        }).then(() => {
            setTimeout(() => {
                this._watchTick(query, vars, onemitter, timeout);
            }, timeout);
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Client;
