"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const _1 = require(".");
let client;
process.on("message", (message) => __awaiter(this, void 0, void 0, function* () {
    if (!process.send) {
        throw new Error("Process not forked");
    }
    switch (message.command) {
        case "new":
            client = new _1.Client(message.args[0]);
            break;
        case "unsubscribe":
            yield client.unsubscribe(message.id);
            process.send({
                type: "resolve",
                id: message.id,
            });
            break;
        case "live":
            const result = (yield client.live.apply(client, message.args));
            result.onemitter.on((data) => {
                if (!process.send) {
                    throw new Error("Process not forked");
                }
                process.send({
                    id: message.id,
                    data,
                });
            });
            process.send({
                type: "resolveLive",
                id: message.id,
                data: result.id,
            });
            break;
        default:
    }
}));
