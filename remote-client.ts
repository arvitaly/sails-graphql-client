import { ChildProcess, fork } from "child_process";
import { IQuery } from "membra";
import onemitter, { Onemitter } from "onemitter";
import { IOptions } from ".";
import { IRemoteMessage } from "./typings";
export class Client {
    protected messageId = 0;
    protected commands: {
        [index: string]: {
            id: string;
            resolve: (data: any) => void;
            onemitter: Onemitter<any>;
        },
    } = {};
    protected child: ChildProcess;
    constructor(public opts: IOptions) {
        this.child = fork(__dirname + "/remote-server");
        this.child.on("message", (data) => {
            if (data.type === "resolve") {
                this.commands[data.id].resolve(data.data);
                return;
            }
            if (data.type === "resolveLive") {
                this.commands[data.id].resolve({
                    id: data.data.id,
                    onemitter: this.commands[data.id].onemitter,
                });
                return;
            }
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
    public async unsubscribe(id: string) {
        this.send({
            command: "unsubscribe",
            id,
            args: [],
        });
    }
    public async live<T>(query: IQuery<T>, vars?: any): Promise<{
        onemitter: Onemitter<T>;
        id: string;
    }> {
        const id = this.getMessageId();
        this.send({
            args: [query, vars],
            command: "live",
            id,
        });
        const o = onemitter<any>();
        return new Promise<any>((resolve) => {
            this.commands[id] = {
                id,
                resolve,
                onemitter: o,
            };
        });
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
