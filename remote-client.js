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
const child_process_1 = require("child_process");
const onemitter_1 = require("onemitter");
class Client {
    constructor(opts) {
        this.opts = opts;
        this.messageId = 0;
        this.commands = {};
        this.child = child_process_1.fork(__dirname + "/remote-server");
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
            }
            else {
                console.warn(data);
            }
        });
        this.send({
            args: [opts],
            command: "new",
            id: this.getMessageId(),
        });
    }
    send(message) {
        this.child.send(message);
    }
    unsubscribe(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.send({
                command: "unsubscribe",
                id,
                args: [],
            });
        });
    }
    live(query, vars) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = this.getMessageId();
            this.send({
                args: [query, vars],
                command: "live",
                id,
            });
            const o = onemitter_1.default();
            return new Promise((resolve) => {
                this.commands[id] = {
                    id,
                    resolve,
                    onemitter: o,
                };
            });
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            return Promise.resolve(this.child.kill());
        });
    }
    getMessageId() {
        this.messageId++;
        return "" + this.messageId;
    }
}
exports.Client = Client;
exports.default = (opts) => {
    const client = new Client(opts);
    return client;
};
