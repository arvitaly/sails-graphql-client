"use strict";
const relay_common_1 = require("relay-common");
const SailsIOJS = require("sails.io.js");
const SocketIOClient = require("socket.io-client");
const io = SailsIOJS(SocketIOClient);
io.sails.autoConnect = false;
class Client {
    constructor(opts) {
        this.opts = opts;
        this.relay = new relay_common_1.Relay(this);
        if (opts.env) {
            io.sails.environment = opts.env;
        }
        this.socket = io.sails.connect(this.opts.url);
        this.socket.on("reconnect", () => {
            this.relay.restoreAllLive();
        });
        this.socket.on("live", (message) => {
            switch (message.kind) {
                case "add":
                    this.relay.addNode(message.id, message.globalId, message.data);
                    break;
                case "update":
                    this.relay.updateNode(message.id, message.globalId, message.data);
                    break;
                default:
            }
        });
    }
    live(query, vars) {
        return this.relay.live(query, vars);
    }
    fetch(q, vars, subscriptionId) {
        return new Promise((resolve, reject) => {
            this.socket.request({
                data: { query: q, vars, subscriptionId },
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                method: "POST",
                url: this.opts.path,
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
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Client;
