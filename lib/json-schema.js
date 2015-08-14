/// <reference path="../typings/typings.d.ts" />
var mongoose = require('mongoose');
var _ = require('lodash');
var typeStringToMongooseType = {
    'string': String,
    'boolean': Boolean,
    'number': Number,
    'integer': Number
};
var typeRefToMongooseType = {
    '#/definitions/objectid': mongoose.Schema.Types.ObjectId,
    '#/definitions/dateOrDatetime': Date
};
var subSchemaType = function (parentSchema, subschema, key) {
    return (parentSchema.required.indexOf(key) >= 0 && !_.isPlainObject(subschema)) ?
        { type: subschema, required: true }
        : subschema;
};
var schemaParamsToMongoose = {
    /**
    * default value
    */
    default: function (default_) {
        var func = (_.last(/^\[Function=(.+)\]$/.exec(default_)) || '')
            .replace(/\\_/g, '`underscore`')
            .replace(/_/g, ' ')
            .replace(/`underscore`/g, '_');
        return {
            default: eval(func) || default_
        };
    },
    /**
    * Pattern for value to match
    */
    pattern: function (pattern) { return { match: RegExp(pattern) }; },
    type: function (type) { return { type: typeStringToMongooseType[type] }; },
    minLength: function (min) { return { minlength: min }; },
    maxLength: function (max) { return { maxlength: max }; },
    minimum: function (min) { return { min: min }; },
    maximum: function (max) { return { max: max }; },
    enum: function (members) { return { enum: members }; }
};
var toMongooseParams = function (acc, val, key) {
    var func;
    return (func = schemaParamsToMongoose[key]) ? _.assign(acc, func(val)) : acc;
};
var unsupportedRefValue = function (jsonSchema) { throw new Error("Unsupported $ref value: " + jsonSchema.$ref); };
var unsupportedJsonSchema = function (jsonSchema) { throw new Error('Unsupported JSON schema type, `' + jsonSchema.type + '`'); };
var convert = function (refSchemas, jsonSchema) {
    if (!_.isPlainObject(jsonSchema)) {
        unsupportedJsonSchema(jsonSchema);
    }
    var converted, result, format = jsonSchema.format, isRef = !_.isEmpty(jsonSchema.$ref), isTypeDate = jsonSchema.type === 'string' && (format === 'date' || format === 'date-time'), mongooseRef = typeRefToMongooseType[jsonSchema.$ref], isMongooseRef = !_.isEmpty(mongooseRef), subSchema = _.isEmpty(refSchemas) ? false : refSchemas[jsonSchema.$ref];
    return (result =
        isRef
            ? isMongooseRef ? mongooseRef
                : subSchema ? convert(refSchemas, subSchema)
                    : unsupportedRefValue(jsonSchema)
            : isTypeDate
                ? _.reduce(_.omit(jsonSchema, 'type', 'format'), toMongooseParams, { type: typeRefToMongooseType['#/definitions/dateOrDatetime'] })
                : _.has(typeStringToMongooseType, jsonSchema.type)
                    ? _.reduce(jsonSchema, toMongooseParams, {})
                    : (jsonSchema.type === 'object')
                        ? _.isEmpty(jsonSchema.properties)
                            ? mongoose.Schema.Types.Mixed
                            : (converted = _.mapValues(jsonSchema.properties, convert.bind(null, refSchemas)),
                                jsonSchema.required ? (_.mapValues(converted, subSchemaType.bind(null, jsonSchema))) : converted)
                        : (jsonSchema.type === 'array')
                            ? !_.isEmpty(jsonSchema.items)
                                ? [convert(refSchemas, jsonSchema.items)]
                                : []
                            : !_.has(jsonSchema, 'type')
                                ? mongoose.Schema.Types.Mixed
                                : unsupportedJsonSchema(jsonSchema));
};
var createMongooseSchema = _.curry(convert);
module.exports = createMongooseSchema;
//# sourceMappingURL=json-schema.js.map