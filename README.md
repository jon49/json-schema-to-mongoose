# JSON Schema to Mongoose (Schema)

A translation library between [JSON Schema](http://json-schema.org/) and
[Mongoose Schema](http://mongoosejs.com/docs/guide.html). Written in TypeScript.

This project was created from the ashes of `json-schema-converter`. I took away
some features and made it more single purpose and added features to the
conversion.

## Installation

    npm install https://github.com/agrozyme/json-schema-to-mongoose.git

## Usage

```typescript
import createMongooseSchema from 'json-schema-to-mongoose';

// Or use plain javascript
// var createMongooseSchema = require('json-schema-to-mongoose').default;
// var util = require('util');

// example json-schema references
const refs =
{
    yep:
    {
        type: 'string',
        pattern: '^\\d{3}$'
    },
    idSpec: {
        type: 'object',
        properties:
        {
            id:
            {
                $ref: 'yep'
            }
        }
    }
};

// example schema to convert to mongoose schema
const schema =
{
    type: 'object',
    properties:
    {
        id:
        {
            $ref: 'yep'
        },
        address:
        {
            type: 'object',
            properties:
            {
                street: {type: 'string', default: '44', pattern: '^\\d{2}$'},
                houseColor: {type: 'string', default: '[Function=Date.now]', format: 'date-time'}
            }
        }
    }
};

//Convert the schema
const mongooseSchema = createMongooseSchema(refs, schema);

//Alternative syntax, which makes it so you can convert many at one time.

// var jsonSchemas = {commonRef: ..., good: ..., schema: ..., naming: ...}
// var convert = createMongooseSchema(jsonSchemas)
// var schemaNames = ['good', 'schema', 'naming']
// var schemas = _.map(schemaNames, (name) => { return jsonSchemas[name] })
// var mongooseSchemas = _.zipObject(schemaNames, schemas.reduce((mongooseSchemas, schema) => {
//     return mongooseSchemas.concat(convert(schema))
// }, []))

console.dir(mongooseSchema, {depth: null});

const Schema = new mongoose.Schema(mongooseSchema);

```