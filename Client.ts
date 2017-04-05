import { buildClientSchema, DocumentNode, GraphQLSchema } from "graphql";
import { Fields, fromQuery, GraphQLFieldsInfo } from "graphql-fields-info";
import { Connection } from "graphql-relay";
import { Generator, IQuery, IResolver, Membra } from "membra";
import onemitter, { Onemitter } from "onemitter";
import { LiveMessage } from "sails-graphql-interfaces";
import SailsIOJS = require("sails.io.js");
import SocketIOClient = require("socket.io-client");
const io = SailsIOJS(SocketIOClient);
io.sails.autoConnect = false;
export interface IOptions {
    url: string;
    path: string;
    env?: string;
    isBase64Transfer?: boolean;
    schema?: GraphQLSchema;
    schemaJSON?: any;
}
interface IUpdateMessage {
    data: any;
    type: "update" | "create" | "remove";
    id: string;
    globalId: string;
}
type GlobalID = string;
interface IRow {
    id: GlobalID;
    [index: string]: any;
}

class Client<S> implements IResolver {
    protected socket: SailsIOJS.Socket;
    protected membra: Membra;
    protected generator: Generator<S>;
    constructor(public opts: IOptions) {
        this.membra = new Membra(this);
        if (opts.schema) {
            this.generator = new Generator(opts.schema);
        } else {
            if (opts.schemaJSON) {
                const schema = buildClientSchema(opts.schemaJSON);
                this.generator = new Generator(schema);
            }
        }
        if (opts.env) {
            io.sails.environment = opts.env;
        }
        io.sails.useCORSRouteToGetCookie = false;
        io.sails.reconnection = true;
        this.socket = io.sails.connect(this.opts.url);
        this.socket.on("reconnect", () => {
            this.membra.restoreAllLive();
        });
        this.socket.on("live", (message: LiveMessage) => {
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
    public unsubscribe(id: string) {
        return this.fetch(``, null, id, true);
    }
    public live<T>(query: IQuery<T>, vars?: any) {
        return this.membra.live<T>(query, vars);
    }
    public async fetchSchemaJSON(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.socket.get("/graphql.schema.json", (body: string, jwr: any) => {
                if (jwr.statusCode !== 200) {
                    reject("Invalid request, status code " + jwr.statusCode + ", response" + JSON.stringify(jwr));
                    return;
                }
                resolve(body);
            });
        });
    }
    public execute<T>(executor: (f: S) => T): Promise<T> {
        return this.membra.execute(this.generator.generate(executor));
    }
    public fetch(q: string, vars?: any, subscriptionId?: string, isUnsubscribe = false): Promise<any> {
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
