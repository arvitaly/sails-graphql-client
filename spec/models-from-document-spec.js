"use strict";
const models_from_document_1 = require("./../models-from-document");
const graphql_1 = require("graphql");
fdescribe("Models from document spec", () => {
    it("when query has 1 model should return array of 1 string", () => {
        const doc = graphql_1.parse(`
        subscription S1{
            model1(id:5){
                name
                title
            }
        }
        mutation M1 {
            updateUser{
                hello
            }
        }
        query Q1{
            model2(name:"na"){
                name
                isActive
            }
            model4{
                id
            }
        }`);
        expect(models_from_document_1.default(doc)).toEqual(["model1", "updateUser", "model2", "model4"]);
    });
});
