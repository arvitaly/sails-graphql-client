"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const membra_1 = require("membra");
const SailsIOJS = require("sails.io.js");
const SocketIOClient = require("socket.io-client");
const io = SailsIOJS(SocketIOClient);
io.sails.autoConnect = false;
class Client {
    constructor(opts) {
        this.opts = opts;
        this.membra = new membra_1.Membra(this);
        if (opts.schema) {
            this.generator = new membra_1.Generator(opts.schema);
        }
        else {
            if (opts.schemaJSON) {
                const schema = graphql_1.buildClientSchema(opts.schemaJSON);
                this.generator = new membra_1.Generator(schema);
            }
        }
        if (opts.env) {
            io.sails.environment = opts.env;
        }
        io.sails.reconnection = true;
        this.socket = io.sails.connect(this.opts.url);
        this.socket.on("reconnect", () => {
            this.membra.restoreAllLive();
        });
        this.socket.on("live", (message) => {
            switch (message.kind) {
                case "add":
                    this.membra.addNode(message.id, message.globalId, message.data);
                    break;
                case "update":
                    this.membra.updateNode(message.id, message.globalId, message.data);
                    break;
                case "remove":
                    this.membra.removeNode(message.id, message.globalId);
                    break;
                default:
            }
        });
    }
    unsubscribe(id) {
        return this.fetch(``, null, id, true);
    }
    live(query, vars) {
        return this.membra.live(query, vars);
    }
    fetchSchemaJSON() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.socket.get("/graphql.schema.json", (body, jwr) => {
                    if (jwr.statusCode !== 200) {
                        reject("Invalid request, status code " + jwr.statusCode + ", response" + JSON.stringify(jwr));
                        return;
                    }
                    resolve(body);
                });
            });
        });
    }
    execute(executor) {
        return this.membra.execute(this.generator.generate(executor));
    }
    fetch(q, vars, subscriptionId, isUnsubscribe = false) {
        return new Promise((resolve, reject) => {
            this.socket.request({
                data: {
                    query: this.opts.isBase64Transfer ? new Buffer(q).toString("base64") : q,
                    variables: vars, subscriptionId,
                    isBase64Transfer: this.opts.isBase64Transfer ? 1 : undefined,
                },
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                method: "POST",
                url: this.opts.path + (isUnsubscribe ? "-unsubscribe" : ""),
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
exports.default = Client;
