export interface IRemoteMessage {
    command: "new" | "live";
    args: any[];
    id: string;
}