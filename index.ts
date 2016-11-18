import onemitter, { IOneEmitter } from "onemitter";
import * as IO from "sails.io.js";
import * as  SailsClient from "socket.io-client";
export interface IConfig {
    address: string;
    path: string;
}
class Client {
    public io: SailsIOJS.IClient;
    constructor(public config: IConfig) {
        this.io = IO(SailsClient);
        this.io.sails.url = config.address;
    }
    public request<T>(q, vars?): Promise<T> {
        return new Promise((resolve, reject) => {
            this.io.socket.request({
                data: { query: q, vars },
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                method: "POST",
                url: this.config.path
            }, (body: string, jwr) => {
                const data: { data: any, errors: any } = JSON.parse(body);
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
    public query<T>(q, vars?): Promise<T> {
        let varsA = [];
        if (vars) {
            for (let varName in vars) {
                varsA.push("$")
            }
        }
    }
    private
    /*mutate<T>(q, vars): Promise<T> {
        return this.lokkaClient.mutate(q, vars);
    }
    watch<T>(q, vars, opts?: { pollingTimeout?: number }): IOneEmitter<T> {
        opts = opts || {};
        opts.pollingTimeout = opts.pollingTimeout || 10000;
        const o = onemitter();
        this._watchTick(q, vars, o, opts.pollingTimeout);
        return o;
    }
    _watchTick(query, vars, onemitter, timeout) {
        this.query(query, vars).then((result) => {
            onemitter(result);
        }).catch((e) => {
            console.error(e);
        }).then(() => {
            setTimeout(() => {
                this._watchTick(query, vars, onemitter, timeout);
            }, timeout)
        })
    }*/
}
export default Client;