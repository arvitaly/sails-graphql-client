import getModelsFromDocument from "./../models-from-document";
import { parse } from "graphql";
fdescribe("Models from document spec", () => {
    it("when query has 1 model should return array of 1 string", () => {
        const doc = parse(`
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
        expect(getModelsFromDocument(doc)).toEqual(["model1", "updateUser", "model2", "model4"]);
    });
});
