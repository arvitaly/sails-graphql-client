"use strict";
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
                    "Content-Type": "application/json"
                },
                method: "POST",
                url: this.config.path
            }, (body, jwr) => {
                const data = JSON.parse(body);
                if (jwr.statusCode !== 200) {
                    reject("Invalid request, status code " + jwr.statusCode + ", response" + jwr.toString());
                    return;
                }
                if (data.errors) {
                    reject("Errors: " + JSON.stringify(data.errors));
                    return;
                }
                resolve(data.data);
            });
        });
    }
    query(q, vars) {
        let varsA = [];
        if (vars) {
            for (let varName in vars) {
                varsA.push("$");
            }
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Client;
