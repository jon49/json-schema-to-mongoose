"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var mongoose = require("mongoose");
var typeStringToMongooseType = { 'string': String, 'boolean': Boolean, 'number': Number, 'integer': Number };
var typeRefToMongooseType = {
    '#/definitions/objectid': mongoose.Schema.Types.ObjectId, '#/definitions/dateOrDatetime': Date
};
var subSchemaTypeV3 = function (parentSchema, subschema, key) {
    return (0 <= parentSchema.required.indexOf(key) && !_.isPlainObject(subschema)) ? {
        type: subschema, required: true
    } : subschema;
};
var subSchemaTypeV4 = function (parentSchema, subschema, key) {
    return (0 <= parentSchema.required.indexOf(key)) ? !_.isPlainObject(subschema) ? {
        type: subschema, required: true
    } : subschema.hasOwnProperty('type') ? _.assign(subschema, { required: true }) : subschema : subschema;
};
// noinspection ReservedWordAsName
var schemaParamsToMongoose = {
    /**
     * default value
     */
    default: function (default_) {
        var func = (_.last(/^\[Function=(.+)\]$/.exec(default_)) || '')
            .replace(/\\_/g, '`underscore`')
            .replace(/_/g, ' ')
            .replace(/`underscore`/g, '_');
        // noinspection ReservedWordAsName,DynamicallyGeneratedCodeJS
        return { default: eval(func) || default_ };
    },
    /**
     * Pattern for value to match
     */
    pattern: function (pattern) { return ({ match: RegExp(pattern) }); },
    type: function (type) { return ({ type: typeStringToMongooseType[type] }); },
    minLength: function (min) { return ({ minlength: min }); },
    maxLength: function (max) { return ({ maxlength: max }); },
    minimum: function (min) { return ({ min: min }); },
    maximum: function (max) { return ({ max: max }); },
    enum: function (members) { return ({ enum: members }); }
};
var toMongooseParams = function (acc, val, key) {
    var func;
    // noinspection AssignmentResultUsedJS
    return (func = schemaParamsToMongoose[key]) ? _.assign(acc, func(val)) : acc;
};
var unsupportedRefValue = function (jsonSchema) {
    throw new Error('Unsupported $ref value: ' + jsonSchema.$ref);
};
var unsupportedJsonSchema = function (jsonSchema) {
    throw new Error('Unsupported JSON schema type, `' + jsonSchema.type + '`');
};
var convertV = function (version, refSchemas, jsonSchema) {
    if (!_.isPlainObject(jsonSchema)) {
        unsupportedJsonSchema(jsonSchema);
    }
    var converted, result, format = jsonSchema.format, isRef = !_.isEmpty(jsonSchema.$ref), isTypeDate = ('string' === jsonSchema.type) && (('date' === format) || ('date-time' === format)), mongooseRef = typeRefToMongooseType[jsonSchema.$ref], isMongooseRef = ('undefined' != typeof (mongooseRef)), subSchema = _.isEmpty(refSchemas) ? false : refSchemas[jsonSchema.$ref], subSchemaType = (4 == version) ? subSchemaTypeV4 : subSchemaTypeV3;
    return (result =
        isRef ?
            isMongooseRef ?
                mongooseRef :
                subSchema ?
                    convertV(version, refSchemas, subSchema) :
                    unsupportedRefValue(jsonSchema)
            :
                isTypeDate ?
                    _.reduce(_.omit(jsonSchema, 'type', 'format'), toMongooseParams, { type: typeRefToMongooseType['#/definitions/dateOrDatetime'] })
                    :
                        _.has(typeStringToMongooseType, jsonSchema.type) ?
                            _.reduce(jsonSchema, toMongooseParams, {})
                            :
                                (jsonSchema.type === 'object') ?
                                    _.isEmpty(jsonSchema.properties) ?
                                        mongoose.Schema.Types.Mixed :
                                        (converted =
                                            _.mapValues(jsonSchema.properties, convertV.bind(null, version, refSchemas)), jsonSchema.required ?
                                            (_.mapValues(converted, subSchemaType.bind(null, jsonSchema))) :
                                            converted)
                                    :
                                        (jsonSchema.type === 'array') ?
                                            !_.isEmpty(jsonSchema.items) ?
                                                [convertV(version, refSchemas, jsonSchema.items)] :
                                                []
                                            :
                                                !_.has(jsonSchema, 'type') ?
                                                    mongoose.Schema.Types.Mixed :
                                                    unsupportedJsonSchema(jsonSchema));
};
var convert = function (refSchemas, jsonSchema) {
    var version = 3;
    switch (jsonSchema.$schema) {
        case 'http://json-schema.org/draft-03/schema#':
            version = 3;
            break;
        case 'http://json-schema.org/draft-04/schema#':
            version = 4;
            break;
        // backwards compatibility
        default:
            version = 3;
            break;
    }
    return convertV(version, refSchemas, jsonSchema);
};
// noinspection JSUnusedGlobalSymbols
exports.default = _.curry(convert);
