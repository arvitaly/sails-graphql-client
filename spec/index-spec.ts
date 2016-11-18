import Sails = require("sails");
import Client from "./../";
describe("Client spec", () => {
    let app: Sails.Sails;
    let client: Client;
    it("when request correct should return result", async (done) => {
        try {
            await (client.request(`
                mutation M1{ 
                    createUser( input: {firstName: "UserName1"} ){ 
                        user{
                            id
                        } 
                    } 
                }`));
            const result = await client.request(
                `query Q1($name:String){ user(firstNameContains:$name){ ...F1 } }
                fragment F1 on User{
                    firstName
                }
                `,
                { name: "Name" });
            expect(j(result)).toEqual(j({ user: { firstName: "UserName1" } }));
            done();
        } catch (e) {
            fail(e);
            done();
        }
    });
    it("when call query should add query and vars to request and return result", async (done) => {
        done();
    });
    beforeAll((done) => {
        const sails = new Sails.constructor();
        sails.lift({
            port: 14000,
            appPath: __dirname + "/fixtures/app1",
            connections: { memory: { adapter: "sails-memory" } },
            models: { connection: "memory", migrate: "drop" },
        }, (err, app2) => {
            if (err) { fail(err); done(); return; }
            app = app2;
            client = new Client({
                address: "http://127.0.0.1:" + 14000,
                path: "/graphql",
            });
            done();
        });
    });
    afterAll((done) => {
        app.lower(done);
    })
});
function j(data) {
    return JSON.parse(JSON.stringify(data));
}