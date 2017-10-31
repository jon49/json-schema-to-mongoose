import * as _ from 'lodash';
import * as mongoose from 'mongoose';

const typeStringToMongooseType = {'string': String, 'boolean': Boolean, 'number': Number, 'integer': Number};

const typeRefToMongooseType = {
  '#/definitions/objectid': mongoose.Schema.Types.ObjectId, '#/definitions/dateOrDatetime': Date
};

const subSchemaTypeV3 = (parentSchema: any, subschema: any, key: any) => {
  return (0 <= parentSchema.required.indexOf(key) && !_.isPlainObject(subschema)) ? {
    type: subschema, required: true
  } : subschema;
};

const subSchemaTypeV4 = (parentSchema: any, subschema: any, key: any) => {
  return (0 <= parentSchema.required.indexOf(key) ) ? !_.isPlainObject(subschema) ? {
    type: subschema, required: true
  } : subschema.hasOwnProperty('type') ? _.assign(subschema, {required: true}) : subschema : subschema;
};

// noinspection ReservedWordAsName
const schemaParamsToMongoose = {
  /**
   * default value
   */
  default: (default_: string) => {
    const func = (_.last(/^\[Function=(.+)\]$/.exec(default_)) || '')
    .replace(/\\_/g, '`underscore`')
    .replace(/_/g, ' ')
    .replace(/`underscore`/g, '_');

    // noinspection ReservedWordAsName,DynamicallyGeneratedCodeJS
    return {default: eval(func) || default_};
  },

  /**
   * Pattern for value to match
   */
  pattern: (pattern: string) => ({match: RegExp(pattern)}),
  type: (type: string) => ({type: (<any>typeStringToMongooseType)[type]}),
  minLength: (min: number) => ({minlength: min}),
  maxLength: (max: number) => ({maxlength: max}),
  minimum: (min: number) => ({min: min}),
  maximum: (max: number) => ({max: max}),
  enum: (members: any[]) => ({enum: members})
};

const toMongooseParams = (acc: any, val: any, key: any) => {
  let func;

  // noinspection AssignmentResultUsedJS
  return (func = (<any>schemaParamsToMongoose)[key]) ? _.assign(acc, func(val)) : acc;
};

const unsupportedRefValue = (jsonSchema: any) => {
  throw new Error('Unsupported $ref value: ' + jsonSchema.$ref);
};

const unsupportedJsonSchema = (jsonSchema: any) => {
  throw new Error('Unsupported JSON schema type, `' + jsonSchema.type + '`');
};

const convertV = (version: any, refSchemas: any, jsonSchema: any): any => {

  if (!_.isPlainObject(jsonSchema)) {
    unsupportedJsonSchema(jsonSchema);
  }

  let converted,
    result,
    format = jsonSchema.format,
    isRef = !_.isEmpty(jsonSchema.$ref),
    isTypeDate = ('string' === jsonSchema.type) && (('date' === format) || ('date-time' === format)),
    mongooseRef = (<any>typeRefToMongooseType)[jsonSchema.$ref],
    isMongooseRef = ('undefined' != typeof(mongooseRef)),
    subSchema = _.isEmpty(refSchemas) ? false : refSchemas[jsonSchema.$ref],
    subSchemaType = (4 == version) ? subSchemaTypeV4 : subSchemaTypeV3;

  return (result =
      isRef ?
        isMongooseRef ?
          mongooseRef :
          subSchema ?
            convertV(version, refSchemas, subSchema) :
            unsupportedRefValue(jsonSchema)

        :
        isTypeDate ?
          _.reduce(<any> _.omit(jsonSchema, 'type', 'format'), toMongooseParams, {type: typeRefToMongooseType['#/definitions/dateOrDatetime']})

          :
          _.has(typeStringToMongooseType, jsonSchema.type) ?
            _.reduce(jsonSchema, toMongooseParams, {})

            :
            (jsonSchema.type === 'object') ?
              _.isEmpty(jsonSchema.properties) ?
                mongoose.Schema.Types.Mixed :
                ( converted =
                  _.mapValues(jsonSchema.properties, convertV.bind(null, version, refSchemas)), jsonSchema.required ?
                  (_.mapValues(converted, subSchemaType.bind(null, jsonSchema))) :
                  converted )

              :
              (jsonSchema.type === 'array') ?
                !_.isEmpty(jsonSchema.items) ?
                  [convertV(version, refSchemas, jsonSchema.items)] :
                  []

                :
                !_.has(jsonSchema, 'type') ?
                  mongoose.Schema.Types.Mixed :
                  unsupportedJsonSchema(jsonSchema)
  );
};

const convert = (refSchemas: any, jsonSchema: any): any => {
  let version = 3;

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

interface CreateMongooseSchema {
  (refSchemas: any, jsonSchema: any): any

  (refSchemas: any): (jsonSchema: any) => any
}

const createMongooseSchema = <CreateMongooseSchema> _.curry(convert);
export = createMongooseSchema
