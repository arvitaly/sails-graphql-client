import { Onemitter } from "onemitter";
import Client from ".";
import { IRemoteMessage } from "./typings";
let client: Client;
process.on("message", async (message: IRemoteMessage) => {
    switch (message.command) {
        case "new":
            client = new Client(message.args[0]);
            break;
        case "live":
            const o: Onemitter<any> = (await client.live.apply(client, message.args)).onemitter;
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
});
