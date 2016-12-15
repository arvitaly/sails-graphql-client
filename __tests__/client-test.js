"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const graphql_1 = require("graphql");
const graphql_relay_1 = require("graphql-relay");
const relay_common_1 = require("relay-common");
const sails_fixture_app_1 = require("sails-fixture-app");
const schema_1 = require("./../__fixtures__/schema");
const remote_client_1 = require("./../remote-client");
const schema = graphql_1.buildClientSchema(schema_1.default.data);
describe("Client tests", () => {
    let app;
    let client;
    let queryParser;
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        queryParser = new relay_common_1.QueryParser(schema);
        app = yield sails_fixture_app_1.lift();
        client = remote_client_1.default({
            path: "/graphql",
            url: "http://127.0.0.1:14001",
        });
    }));
    afterEach(() => __awaiter(this, void 0, void 0, function* () {
        yield app.kill();
        yield client.close();
    }));
    it("live query one", () => __awaiter(this, void 0, void 0, function* () {
        const query = queryParser.parse `query Q1{
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
        const o1 = yield client.live(query);
        expect(yield o1.wait()).toMatchSnapshot();
        app.create("model2", { name: "name2Test", key: 1.1 });
        const data = yield o1.wait();
        expect(data).toMatchSnapshot();
        app.update("model2", graphql_relay_1.fromGlobalId(data.viewer.model2s.edges[0].node.id).id, { name: "newName" });
        expect(yield o1.wait()).toMatchSnapshot();
    }));
});