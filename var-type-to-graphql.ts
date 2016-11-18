export default (value: any) => {
    const type = typeof (value);
    switch (type) {
        case "string":
            return "String";
        case "number":
            return Math.round(value) === value ? "Int" : "Float";
        case "boolean":
            return "Boolean";
        case "object":
            if (value instanceof Date) {
                return "String";
            }
        default:
            throw new Error("Unknown var type " + type);
    }
}