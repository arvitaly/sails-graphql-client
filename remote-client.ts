import { ChildProcess, fork } from "child_process";
import onemitter, { Onemitter } from "onemitter";
import { IQuery } from "relay-common";
import RealClient, { IOptions } from ".";
import { IRemoteMessage } from "./typings";
export class Client {
    protected messageId = 0;
    protected commands: {
        [index: string]: {
            id: string;
            onemitter: Onemitter<any>;
        },
    } = {};
    protected child: ChildProcess;
    constructor(public opts: IOptions) {
        this.child = fork(__dirname + "/remote-server");
        this.child.on("message", (data) => {
            if (data.id) {
                this.commands[data.id].onemitter.emit(data.data);
            } else {
                console.warn(data);
            }
        });
        this.send({
            args: [opts],
            command: "new",
            id: this.getMessageId(),
        });
    }
    public send(message: IRemoteMessage) {
        this.child.send(message);
    }
    public async live<T>(query: IQuery, vars?: any): Promise<Onemitter<T>> {
        const id = this.getMessageId();
        this.send({
            args: [query, vars],
            command: "live",
            id,
        });
        const o = onemitter();
        this.commands[id] = {
            id,
            onemitter: o,
        };
        return Promise.resolve(o);
    }
    public async close() {
        return Promise.resolve(this.child.kill());
    }
    protected getMessageId() {
        this.messageId++;
        return "" + this.messageId;
    }
}
export default (opts: IOptions) => {
    const client = new Client(opts);
    return client;
};
