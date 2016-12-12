import { DocumentNode, GraphQLSchema, parse } from "graphql";
import { Fields, fromQuery, GraphQLFieldsInfo } from "graphql-fields-info";
import ggql from "graphql-tag";
import onemitter, { Onemitter } from "onemitter";
import SailsIOJS = require("sails.io.js");
import SocketIOClient = require("socket.io-client");
const io = SailsIOJS(SocketIOClient);
io.sails.autoConnect = false;
export interface IOptions {
    url: string;
    path: string;
}
type QueryInfo = {
    doc: DocumentNode;
    source: string;
    info: GraphQLFieldsInfo;
};
interface IUpdateMessage {
    data: any;
    type: "update" | "create";
    id: string;
    globalId: string;
}
interface IRequestInfo {
    onemitter: Onemitter<any>;
    data: IRow | IRow[];
    queryInfo: QueryInfo;
    type: "one" | "connection";
}
type GlobalID = string;
interface IRow {
    id: GlobalID;
}

class Client {
    public socket: SailsIOJS.Socket;
    protected requests: { [index: string]: IRequestInfo; } = {};
    constructor(public opts: IOptions, public schema: GraphQLSchema) {
        this.socket = io.sails.connect(this.opts.url);
        this.socket.on("live", (message: IUpdateMessage) => {
            switch (message.type) {
                case "create":
                    const rows = this.requests[message.id].data as IRow[];

                    break;
                case "update":
                    switch (this.requests[message.id].type) {
                        case "one":
                            const oldData = this.requests[message.id].data as IRow;
                            this.updateRow(oldData, message.data,
                                this.requests[message.id].queryInfo.info.getQueryOneFields());
                            this.requests[message.id].onemitter.emit(oldData);
                            break;
                        case "connection":
                            const rows = this.requests[message.id].data as IRow[];
                            let row = rows.find((row) => {
                                return row.id === message.globalId;
                            });
                            if (!row) {
                                throw new Error("I want update row with id " + message.globalId
                                    + ", but can't find it");
                            }
                            this.updateRow(row, message.data,
                                this.requests[message.id].queryInfo.info.getQueryConnectionFields());
                            this.requests[message.id].onemitter.emit(rows);
                            break;
                        default:

                    }
                    break;
                default:
            }
        });
    }
    public addRow(rows: IRow[], data: any, fields: Fields) {
        let row: any = {};
        fields.map((field) => {
            if (typeof (data[field.name]) !== "undefined") {
                row[field.name] = data[field.name];
            }
        });
        rows.push(row);
    }
    public updateRow(row: IRow, data: any, fields: Fields) {
        fields.map((field) => {
            if (typeof (data[field.name]) !== "undefined"
                && data[field.name] !== row[field.name]) {
                row[field.name] = data[field.name];
            }
        });
    }
    public async liveOne<T>(query: QueryInfo, vars?: any): Promise<Onemitter<T>> {
        return this.live("one", query, vars);
    }
    public async liveConnection<T>(query: QueryInfo, vars?: any): Promise<Onemitter<T>> {
        return this.live("connection", query, vars);
    }
    public async live<T>(type: "one" | "connection", query: QueryInfo, vars?: any): Promise<Onemitter<T>> {
        const result = await this._request(query, vars);
        const id = (+new Date()) + "" + parseInt("" + (Math.random() * 10000), 0);
        const o = onemitter();
        this.requests[id] = {
            data: null,
            onemitter: o,
            queryInfo: query,
            type,
        };
        return o;
    }
    protected _request(q: QueryInfo, vars?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            this.socket.request({
                data: { query: q.source, vars },
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                method: "POST",
                url: this.opts.path,
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
}
export function gql(literals: any, ...placeholders: any[]): QueryInfo {
    const query: string = "";
    return {
        doc: ggql(literals, ...placeholders),
        info: fromQuery(query),
        source: literals,
    };
}
