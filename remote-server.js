"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const _1 = require(".");
let client;
process.on("message", (message) => __awaiter(this, void 0, void 0, function* () {
    switch (message.command) {
        case "new":
            client = new _1.default(message.args[0]);
            break;
        case "live":
            const o = (yield client.live.apply(client, message.args)).onemitter;
            o.on((data) => {
                if (!process.send) {
                    throw new Error("Process not forked");
                }
                process.send({
                    id: message.id,
                    data,
                });
            });
            break;
        default:
    }
}));
