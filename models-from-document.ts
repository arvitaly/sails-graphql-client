import { Document, Field, OperationDefinition } from "graphql";
export default (doc: Document) => {
    let models: Array<string> = [];
    doc.definitions.map((definition) => {
        switch (definition.kind) {
            case "OperationDefinition":
                const operDef = (definition as OperationDefinition);
                switch (operDef.operation) {
                    case "mutation":
                        break;
                    case "query":
                    case "subscription":
                        const viewer = (operDef.selectionSet.selections[0] as Field).selectionSet;
                        viewer.selections.map((sel) => {
                            if (sel.kind === "Field") {
                                models.push(sel.name.value);
                            }
                        })
                        break;
                    default:
                        throw new Error("Unknown operation " + operDef.operation);
                }
                break;
            default:
                throw new Error("Unknown definition kind " + definition.kind);
        }
    });
    return models;
};
