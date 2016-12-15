"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const child_process_1 = require("child_process");
const onemitter_1 = require("onemitter");
class Client {
    constructor(opts) {
        this.opts = opts;
        this.messageId = 0;
        this.commands = {};
        this.child = child_process_1.fork(__dirname + "/remote-server");
        this.child.on("message", (data) => {
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
    live(query, vars) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = this.getMessageId();
            this.send({
                args: [query, vars],
                command: "live",
                id,
            });
            const o = onemitter_1.default();
            this.commands[id] = {
                id,
                onemitter: o,
            };
            return Promise.resolve(o);
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (opts) => {
    const client = new Client(opts);
    return client;
};
