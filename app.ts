import createMongooseSchema = require('./lib/json-schema')
import util = require('util')

//var refs =
//{
//    yep:
//    {
//        type: 'string',
//        pattern: '^\\d{3}$'
//    },
//    idSpec: {
//        type: 'object',
//        properties:
//        {
//            id:
//            {
//                $ref: 'yep'
//            }
//        }
//    }
//}

//var valid =
//{
//    type: 'object',
//    properties:
//    {
//        id:
//        {
//            $ref: 'yep'
//        },
//        address:
//        {
//            type: 'object',
//            properties:
//            {
//                street: {type: 'string', default: '44', pattern: '^\\d{2}$'},
//                houseColor: {type: 'string', default: '[Function=Date.now]', format: 'date-time'}
//            }
//        }
//    }
//}
                    
var refs = {
    yep: {
        type: 'string',
        pattern: '^\\d{3}$'},
    a: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                num: {type: 'number'},
                str: {type: 'string'}
    }}},
    idSpec: {
        type: 'object',
        properties: {
            id: {$ref: 'yep'},
            arr: {$ref: 'a'}
}}}

var valid = {
    type: 'object',
    properties: {
        id: {$ref: 'yep'},
        arr: {$ref: 'a'},
        address: {
            type: 'object',
            properties: {
                street: {type: 'integer', default: 44, minimum: 0, maximum: 50},
                houseColor: {type: 'string', default: '[Function=Date.now]', format: 'date-time'}
}}}}

var result = createMongooseSchema(refs, valid)

console.log(util.inspect(result, false, null))