import { DocumentNode } from "graphql";
import { Fields, fromQuery, GraphQLFieldsInfo } from "graphql-fields-info";
import { Connection } from "graphql-relay";
import onemitter, { Onemitter } from "onemitter";
import { IQuery, IResolver, Relay } from "relay-common";
import { LiveMessage } from "sails-graphql-interfaces";
import SailsIOJS = require("sails.io.js");
import SocketIOClient = require("socket.io-client");
const io = SailsIOJS(SocketIOClient);
io.sails.autoConnect = false;
export interface IOptions {
    url: string;
    path: string;
    env?: string;
}
interface IUpdateMessage {
    data: any;
    type: "update" | "create";
    id: string;
    globalId: string;
}
type GlobalID = string;
interface IRow {
    id: GlobalID;
    [index: string]: any;
}

class Client implements IResolver {
    protected socket: SailsIOJS.Socket;
    protected relay: Relay;
    constructor(public opts: IOptions) {
        this.relay = new Relay(this);
        if (opts.env) {
            io.sails.environment = opts.env;
        }
        io.sails.reconnection = true;
        this.socket = io.sails.connect(this.opts.url);
        this.socket.on("reconnect", () => {
            this.relay.restoreAllLive();
        });
        this.socket.on("live", (message: LiveMessage) => {
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
    public unsubscribe(id: string) {
        return this.fetch(``, null, id, true);
    }
    public live(query: IQuery, vars?: any) {
        return this.relay.live(query, vars);
    }
    public fetch(q: string, vars?: any, subscriptionId?: string, isUnsubscribe = false): Promise<any> {
        return new Promise((resolve, reject) => {
            this.socket.request({
                data: { query: q, vars, subscriptionId },
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                method: "POST",
                url: this.opts.path + (isUnsubscribe ? "-unsubscribe" : ""),
            }, (body: string, jwr: any) => {
                if (jwr.statusCode !== 200) {
                    reject("Invalid request, status code " + jwr.statusCode + ", response" + JSON.stringify(jwr));
                    return;
                }
                const data: { data: any, errors: any } = JSON.parse(body);
                if (data.errors) {
                    reject("Errors: " + JSON.stringify(data.errors));
                    return;
                }
                resolve(data.data);
            });
        });
    }
}
export default Client;
