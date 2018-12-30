import * as assert from 'assert';
import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import createMongooseSchema from '../lib/json-schema';

describe('mongoose schema conversion:', function () {
  describe('createMongooseSchema', function () {
    _.each([
      {type: 'objectttttt'}, {
        type: 'object', properties: 'not an object'
      }, {
        type: 'object', properties: {email: {type: 'not a type'}}
      }
    ], function (invalid) {
      it('throws when the incorrect type is given', () => {

        assert.throws(() => {
          // noinspection VoidExpressionJS
          createMongooseSchema(void 0, invalid);
        }, /Unsupported JSON schema/);

        // expect(() => {
        //   createMongooseSchema(void 0, invalid);
        // }).toThrowError(/Unsupported JSON schema/);
      });
    });

    _.each([
      {
        type: 'object', properties: {id: {$ref: '#/nope/nope/nope'}}
      }
    ], function (invalid) {
      it('throws on unsupported ref, ' + invalid, () => {

        assert.throws(() => {
          // noinspection VoidExpressionJS
          createMongooseSchema(void 0, invalid);
        }, /Unsupported .ref/);

        // expect(() => {
        //   createMongooseSchema(void 0, invalid);
        // }).toThrowError(/Unsupported .ref/);
      });
    });

    it('should convert a valid json-schema', () => {
      const refs = {
        yep: {type: 'string', pattern: '^\\d{3}$'},
        a: {
          type: 'array', items: {type: 'object', properties: {num: {type: 'number'}, str: {type: 'string'}}}
        },
        anyValue: {description: 'This can be any value.'},
        idSpec: {type: 'object', properties: {id: {$ref: 'yep'}, arr: {$ref: 'a'}}}
      };

      // noinspection ReservedWordAsName
      const valid = {
        type: 'object', properties: {
          id: {$ref: 'yep'}, arr: {$ref: 'a'}, anyValue: {a: 'b'}, address: {
            type: 'object', properties: {
              street: {type: 'integer', default: 44, minimum: 0, maximum: 50},
              houseColor: {type: 'string', default: '[Function=Date.now]', format: 'date-time'}
            }
          }
        }
      };

      // noinspection ReservedWordAsName
      assert.deepEqual(createMongooseSchema(refs, valid), {
        id: {type: String, match: /^\d{3}$/},
        arr: [{num: {type: Number}, str: {type: String}}],
        anyValue: mongoose.Schema.Types.Mixed,
        address: {
          street: {type: Number, default: 44, min: 0, max: 50}, houseColor: {type: Date, default: Date.now}
        }
      });

      // noinspection ReservedWordAsName
      // expect(createMongooseSchema(refs, valid)).toEqual({
      //   id: {type: String, match: /^\d{3}$/},
      //   arr: [{num: {type: Number}, str: {type: String}}],
      //   anyValue: mongoose.Schema.Types.Mixed,
      //   address: {
      //     street: {type: Number, default: 44, min: 0, max: 50}, houseColor: {type: Date, default: Date.now}
      //   }
      // });

    });

  });
});
