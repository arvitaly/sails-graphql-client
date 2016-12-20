import { Onemitter } from "onemitter";
import { Client } from ".";
import { IRemoteMessage } from "./typings";
let client: Client;
process.on("message", async (message: IRemoteMessage) => {
    if (!process.send) {
        throw new Error("Process not forked");
    }
    switch (message.command) {
        case "new":
            client = new Client(message.args[0]);
            break;
        case "unsubscribe":
            await client.unsubscribe(message.id);
            process.send({
                type: "resolve",
                id: message.id,
            });
            break;
        case "live":
            const result = (await client.live.apply(client, message.args));
            result.onemitter.on((data: any) => {
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
});
