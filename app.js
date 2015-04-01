var createMongooseSchema = require('./lib/json-schema');
var util = require('util');
var refs = {
    yep: {
        type: 'string',
        pattern: '^\\d{3}$'
    },
    idSpec: {
        type: 'object',
        properties: {
            id: {
                $ref: 'yep'
            }
        }
    }
};
var valid = {
    type: 'object',
    properties: {
        id: {
            $ref: 'yep'
        },
        address: {
            type: 'object',
            properties: {
                street: { type: 'string', default: '44', pattern: '^\\d{2}$' },
                houseColor: { type: 'string', default: '[Function=Date.now]', format: 'date-time' }
            }
        }
    }
};
var result = createMongooseSchema(refs, valid);
console.log(util.inspect(result, false, null));
//# sourceMappingURL=app.js.map