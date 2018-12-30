"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var json_schema_1 = require("./lib/json-schema");
var refs = {
    yep: {
        type: 'string', pattern: '^\\d{3}$'
    }, a: {
        type: 'array', items: {
            type: 'object', properties: {
                num: { type: 'number' }, str: { type: 'string' }
            }
        }
    }, idSpec: {
        type: 'object', properties: {
            id: { $ref: 'yep' }, arr: { $ref: 'a' }
        }
    }
};
// noinspection ReservedWordAsName
var valid = {
    type: 'object', properties: {
        id: { $ref: 'yep' }, arr: { $ref: 'a' }, address: {
            type: 'object', properties: {
                street: { type: 'integer', default: 44, minimum: 0, maximum: 50 },
                houseColor: { type: 'string', default: '[Function=Date.now]', format: 'date-time' }
            }
        }
    }
};
var result = json_schema_1.default(refs, valid);
console.dir(result, { depth: null });
