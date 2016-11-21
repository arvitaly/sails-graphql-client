"use strict";
const models_from_document_1 = require("./models-from-document");
const graphql_1 = require("graphql");
const onemitter_1 = require("onemitter");
const IO = require("sails.io.js");
const SailsClient = require("socket.io-client");
class Client {
    constructor(config) {
        this.config = config;
        this.io = IO(SailsClient);
        this.io.sails.transports = ["websocket"];
        this.io.sails.url = config.address;
    }
    request(q, vars) {
        if (typeof (q) === "string") {
            q = this.QL(q);
        }
        return this._request(q, vars);
    }
    QL(q) {
        const doc = graphql_1.parse(q);
        return {
            document: doc,
            models: models_from_document_1.default(doc),
            source: q,
        };
    }
    subscribe(q, vars) {
        let lastResult;
        if (typeof (q) === "string") {
            q = this.QL(q);
        }
        q.models.map((model) => {
            this.io.socket.on(model.toLowerCase(), (event) => {
                switch (event.verb) {
                    case "updated":
                        let modelData = lastResult.viewer[model];
                        let isHasChanges = false;
                        for (let fieldName in modelData) {
                            if (typeof (event.data[fieldName]) !== "undefined" &&
                                modelData[fieldName] !== event.data[fieldName]) {
                                isHasChanges = true;
                                modelData[fieldName] = event.data[fieldName];
                            }
                        }
                        if (isHasChanges) {
                            o1(lastResult);
                        }
                        break;
                    case "created":
                        console.log("created", event);
                        break;
                    default:
                        throw new Error("Unsupported verb " + event.verb);
                }
            });
        });
        this._request(q, vars).then((result) => {
            lastResult = result;
            o1(result);
        });
        const o1 = onemitter_1.default();
        return o1;
    }
    watchRequest(q, vars, opts) {
        opts = opts || {};
        opts.pollingTimeout = opts.pollingTimeout || 10000;
        const o = onemitter_1.default();
        this._watchTick(q, vars, o, opts.pollingTimeout);
        return o;
    }
    _request(q, vars) {
        return new Promise((resolve, reject) => {
            this.io.socket.request({
                data: { query: q.source, vars },
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                method: "POST",
                url: this.config.path,
            }, (body, jwr) => {
                if (jwr.statusCode !== 200) {
                    reject("Invalid request, status code " + jwr.statusCode + ", response" + JSON.stringify(jwr));
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
