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
    it("when watch request onemitter should emitted", async (done) => {
        try {
            await client.request(`
                mutation M1{ 
                    createUser( input: {firstName: "n2"} ){ 
                        user{
                            id
                        } 
                    } 
                }`);
            const handle = jasmine.createSpy("");
            client.watchRequest(`query Q1{ user(firstNameContains:"n2"){ firstName } }`, {},
                { pollingTimeout: 50 })(handle);
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(handle.calls.count() > 1).toBeTruthy();
            expect(handle.calls.argsFor(0)[0]).toEqual({ user: { firstName: "n2" } });
            handle.calls.reset();
            await (client.request(`
                mutation M1{ 
                    updateUser( input:{setFirstName: {firstName:"n23"} } ){ 
                        users{
                            id
                        } 
                    } 
                }`));
            await new Promise((resolve) => setTimeout(resolve, 300));
            expect(handle.calls.argsFor(0)[0]).toEqual({ user: { firstName: "n23" } });
            done();
        } catch (e) {
            fail(e);
            done();
        }
    });
    beforeAll((done) => {
        const sails = new Sails.constructor();
        sails.lift({
            port: 14001,
            appPath: __dirname + "/fixtures/app1",
            connections: { memory: { adapter: "sails-memory" } },
            models: { connection: "memory", migrate: "drop" },
        }, (err, app2) => {
            if (err) { fail(err); done(); return; }
            app = app2;
            client = new Client({
                address: "http://127.0.0.1:" + 14001,
                path: "/graphql",
            });
            setTimeout(() => {
                done();
            }, 2000);
        });
    });
    afterAll((done) => {
        app.lower(done);
    });
});
function j(data) {
    return JSON.parse(JSON.stringify(data));
};
