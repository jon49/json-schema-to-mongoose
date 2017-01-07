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
var subSchemaTypeV3 = function (parentSchema, subschema, key) {
    return (parentSchema.required.indexOf(key) >= 0 && !_.isPlainObject(subschema)) ?
        { type: subschema, required: true }
        : subschema;
};
var subSchemaTypeV4 = function (parentSchema, subschema, key) {
    return (parentSchema.required.indexOf(key) >= 0 ) 
    	? !_.isPlainObject(subschema) 
    		? { type: subschema, required: true }
    		: _.assign(subschema, {required: true})
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
	
	if (jsonSchema.$schema === 'http://json-schema.org/draft-03/schema#') {
		return convertV(3, refSchemas, jsonSchema);
	}
	else if (jsonSchema.$schema === 'http://json-schema.org/draft-04/schema#') {
		return convertV(4, refSchemas, jsonSchema);
	}
	// backwards compatibility
	else {
		return convertV(3, refSchemas, jsonSchema);
	}
}

var convertV = function (version, refSchemas, jsonSchema) {
	if (!_.isPlainObject(jsonSchema)) {
		unsupportedJsonSchema(jsonSchema);
	}
	
    var converted,
        result,
        format = jsonSchema.format,
        isRef = !_.isEmpty(jsonSchema.$ref),
        isTypeDate = jsonSchema.type === 'string' && (format === 'date' || format === 'date-time'),
        mongooseRef = typeRefToMongooseType[jsonSchema.$ref],
        isMongooseRef = typeof(mongooseRef) != 'undefined' ? true : false,
        subSchema = _.isEmpty(refSchemas) ? false : refSchemas[jsonSchema.$ref]
    	subSchemaType = (version == 4) ? subSchemaTypeV4 : subSchemaTypeV3;

    // @FIXME Hack for compliance with schemas which use arrays for type values
    // and where one of the values is "null". e.g. Popolo schemas.
    if (jsonSchema.type) {
      // Look for types that are an array of two types
      if (jsonSchema.type instanceof Array && jsonSchema.type.length == 2) {
    
        // If one of the times is null, remove it
        jsonSchema.type.forEach(function(value, index) {
          if (value == "null")
            jsonSchema.type.splice(index, 1);
        });
    
        // If the array now contains exactly one item, remove trailing comma
        if (jsonSchema.type.length == 1) {
          jsonSchema.type = jsonSchema.type[0].replace(/\,$/, '');
        }
      }
    }
        
    return (result =
        isRef
            ? isMongooseRef 
            	? mongooseRef
                : subSchema 
                	? convertV(version, refSchemas, subSchema)
                    : unsupportedRefValue(jsonSchema)
            : isTypeDate
                ? _.reduce(_.omit(jsonSchema, 'type', 'format'), toMongooseParams, { type: typeRefToMongooseType['#/definitions/dateOrDatetime'] })
                : _.has(typeStringToMongooseType, jsonSchema.type)
                    ? _.reduce(jsonSchema, toMongooseParams, {})
                    : (jsonSchema.type === 'object')
                        ? _.isEmpty(jsonSchema.properties)
                            ? mongoose.Schema.Types.Mixed
                            : (converted = _.mapValues(jsonSchema.properties, convertV.bind(null, version, refSchemas)),
                                jsonSchema.required 
                                	? (_.mapValues(converted, subSchemaType.bind(null, jsonSchema))) 
                                	: converted)
                        : (jsonSchema.type === 'array')
                            ? !_.isEmpty(jsonSchema.items)
                                ? [convertV(version, refSchemas, jsonSchema.items)]
                                : []
                            : !_.has(jsonSchema, 'type')
                                ? mongoose.Schema.Types.Mixed
                                : unsupportedJsonSchema(jsonSchema));
};

var createMongooseSchema = _.curry(convert);
module.exports = createMongooseSchema;
//# sourceMappingURL=json-schema.js.map