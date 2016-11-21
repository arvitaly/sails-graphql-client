"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (doc) => {
    let models = [];
    doc.definitions.map((definition) => {
        switch (definition.kind) {
            case "OperationDefinition":
                const operDef = definition;
                switch (operDef.operation) {
                    case "mutation":
                        break;
                    case "query":
                    case "subscription":
                        const viewer = operDef.selectionSet.selections[0].selectionSet;
                        viewer.selections.map((sel) => {
                            if (sel.kind === "Field") {
                                models.push(sel.name.value);
                            }
                        });
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
