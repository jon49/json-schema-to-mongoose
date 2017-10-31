declare module 'json-schema-to-mongoose' {
  // noinspection JSUnusedGlobalSymbols
  function createMongooseSchema(refSchemas: any, jsonSchema: any): any
  function createMongooseSchema(refSchemas: any): (jsonSchema: any) => any

  export = createMongooseSchema
}