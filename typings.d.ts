export interface IRemoteMessage {
    command: "new" | "live" | "unsubscribe";
    args: any[];
    id: string;
}