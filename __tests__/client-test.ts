import { buildClientSchema } from "graphql";
import { fromGlobalId } from "graphql-relay";
import { QueryParser } from "membra";
import { lift, RemoteApp } from "sails-fixture-app";
import schemaJSON from "./../__fixtures__/schema";
import createClient, { Client } from "./../remote-client";
const schema = buildClientSchema(schemaJSON.data as any);

describe("Client tests", () => {
    let app: RemoteApp;
    let client: Client;
    let queryParser: QueryParser;
    beforeEach(async () => {
        queryParser = new QueryParser(schema);
        app = await lift();
        client = createClient({
            path: "/graphql",
            url: "http://127.0.0.1:14001",
        });
    });
    afterEach(async () => {
        await app.kill();
        await client.close();
    });
    it("live query one", async () => {
        const query = queryParser.parse`query Q1{
            viewer{
                model2s{
                edges{
                    node{
                        id
                        name
                    }
                }
                }
            }
            }`;
        const result = await client.live<any>(query);
        const o1 = result.onemitter;
        expect(await o1.wait()).toMatchSnapshot();
        app.create("model2", { name: "name2Test", key: 1.1 });
        const data = await o1.wait();
        expect(data).toMatchSnapshot();
        app.update("model2", fromGlobalId(data.viewer.model2s.edges[0].node.id).id, { name: "newName" });
        expect(await o1.wait()).toMatchSnapshot();
        await client.unsubscribe(result.id);
        app.update("model2", fromGlobalId(data.viewer.model2s.edges[0].node.id).id, { name: "newName" });
    });
    it("fetch schema json", () => {
        // TODO
    });
});
