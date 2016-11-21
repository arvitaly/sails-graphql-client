import getModelsFromDocument from "./models-from-document";
import { Document, parse } from "graphql";
import onemitter, { IOneEmitter } from "onemitter";
import * as IO from "sails.io.js";
import * as  SailsClient from "socket.io-client";
export interface IConfig {
    address: string;
    path: string;
}
interface IQueryInfo {
    models: Array<string>;
    document: Document;
    source: string;
}

class Client {
    public io: SailsIOJS.IClient;
    constructor(public config: IConfig) {
        this.io = IO(SailsClient);
        this.io.sails.transports = ["websocket"];
        this.io.sails.url = config.address;
    }
    public request(q: string | IQueryInfo, vars?) {
        if (typeof (q) === "string") {
            q = this.QL(q);
        }
        return this._request(q, vars);
    }
    public QL(q: string): IQueryInfo {
        const doc = parse(q);
        return {
            document: doc,
            models: getModelsFromDocument(doc),
            source: q,
        };
    }
    public subscribe(q: string | IQueryInfo, vars?) {
        let lastResult;
        if (typeof (q) === "string") {
            q = this.QL(q);
        }
        q.models.map((model) => {
            this.io.socket.on(model.toLowerCase(), (event: Sails.WebSocketEvent) => {
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
                        console.log("created", event)
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
        const o1 = onemitter();
        return o1;
    }
    public watchRequest(q, vars?, opts?: { pollingTimeout?: number }): IOneEmitter<any> {
        opts = opts || {};
        opts.pollingTimeout = opts.pollingTimeout || 10000;
        const o = onemitter();
        this._watchTick(q, vars, o, opts.pollingTimeout);
        return o;
    }
    protected _request(q: IQueryInfo, vars?): Promise<any> {
        return new Promise((resolve, reject) => {
            this.io.socket.request({
                data: { query: q.source, vars },
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                method: "POST",
                url: this.config.path,
            }, (body: string, jwr) => {
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
    private _watchTick(query, vars, onemitter, timeout) {
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
export default Client;
