"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const Sails = require("sails");
const _1 = require("./../");
describe("Client spec", () => {
    let app;
    let client;
    it("when request correct should return result", (done) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield (client.request(`
                mutation M1{ 
                    createUser( input: {firstName: "UserName1"} ){ 
                        user{
                            id
                        } 
                    } 
                }`));
            const result = yield client.request(`query Q1($name:String){ user(firstNameContains:$name){ ...F1 } }
                fragment F1 on User{
                    firstName
                }
                `, { name: "Name" });
            expect(j(result)).toEqual(j({ user: { firstName: "UserName1" } }));
            done();
        }
        catch (e) {
            fail(e);
            done();
        }
    }));
    it("when watch request onemitter should emitted", (done) => __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.request(`
                mutation M1{ 
                    createUser( input: {firstName: "n2"} ){ 
                        user{
                            id
                        } 
                    } 
                }`);
            const handle = jasmine.createSpy("");
            client.watchRequest(`query Q1{ user(firstNameContains:"n2"){ firstName } }`, {}, { pollingTimeout: 50 })(handle);
            yield new Promise((resolve) => setTimeout(resolve, 100));
            expect(handle.calls.count() > 1).toBeTruthy();
            expect(handle.calls.argsFor(0)[0]).toEqual({ user: { firstName: "n2" } });
            handle.calls.reset();
            yield (client.request(`
                mutation M1{ 
                    updateUser( input:{setFirstName: {firstName:"n23"} } ){ 
                        users{
                            id
                        } 
                    } 
                }`));
            yield new Promise((resolve) => setTimeout(resolve, 300));
            expect(handle.calls.argsFor(0)[0]).toEqual({ user: { firstName: "n23" } });
            done();
        }
        catch (e) {
            fail(e);
            done();
        }
    }));
    beforeAll((done) => {
        const sails = new Sails.constructor();
        sails.lift({
            port: 14001,
            appPath: __dirname + "/../node_modules/sails-graphql-fixture-app",
            connections: { memory: { adapter: "sails-memory" } },
            models: { connection: "memory", migrate: "drop" },
        }, (err, app2) => {
            if (err) {
                fail(err);
                done();
                return;
            }
            app = app2;
            client = new _1.default({
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
}
;
