import assert = require('assert')
import createMongooseSchema = require('../lib/json-schema')
import mongoose = require('mongoose');
import util = require('util')
import _ = require('lodash')

var inspect = util.inspect
var Schema = mongoose.Schema

describe('mongoose schema conversion:', function() {
    describe('createMongooseSchema', function() {
        _.each([
            {type: 'objectttttt'},
            {type: 'object', properties: 'not an object'},
            {type: 'object',
             properties: {
                    email: {type: 'not a type'}
            }}
        ], function(invalid) {
            it('throws when the incorrect type is given', () => {
                expect(() => { createMongooseSchema(void 0, invalid) }).toThrowError(/Unsupported JSON schema/)
            })
        })

        _.each([{
                type: 'object',
                properties: {
                    id: {$ref: '#/nope/nope/nope'}
        }}], function(invalid) {
            it("throws on unsupported ref, " + invalid, () => {
                expect(() => { createMongooseSchema(void 0, invalid) }).toThrowError(/Unsupported .ref/)
        })})

        it('should convert a valid json-schema', () => {

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
                anyValue: {
                    description: 'This can be any value.'
                },
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
                    anyValue: {a: 'b'},
                    address: {
                        type: 'object',
                        properties: {
                            street: {type: 'integer', default: 44, minimum: 0, maximum: 50},
                            houseColor: {type: 'string', default: '[Function=Date.now]', format: 'date-time'}
            }}}}

            expect(createMongooseSchema(refs, valid)).toEqual({
                id: {type: String, match: /^\d{3}$/},
                arr: [{num: {type: Number}, str: {type: String}}],
                anyValue: mongoose.Schema.Types.Mixed,
                address: {
                    street: {type: Number, default: 44, min: 0, max: 50},
                    houseColor: {type: Date, default: Date.now}
            }})

        })

    })
})
