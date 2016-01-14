require('babel-polyfill');
import {test} from 'tap';
import is from 'is';
import coHandler from './co-handler';
import jsc from 'jsverify';
import Promise from 'bluebird';
import assert from 'assert';

test('co-handler is a yield handler', t => {
  t.equal(is.fn(coHandler), true, 'it is a function');
  t.equal(is.fn(coHandler().then), true, 'it returns a promise');
  t.end();
});


test('co-handler returns a Promise.all call result if called with an array of promises', () => {
  const tests = jsc.forall(
    jsc.nearray(jsc.json),
    expected => {
      const promises = expected.map(Promise.resolve);

      return coHandler(promises)
        .then(results => {
          assert.deepEqual(results, expected, 'co-handler result is equal to the initial array');
          return true;
        })
    }
  );

  return jsc.assert(tests, {tests: 20});
});


test(`co-handler maps the values and resolves the promises in the array`, () => {
  const testingFunction = ([arg, expected]) => (
    coHandler(arg)
      .then(
        result => assert.deepEqual(result, expected, 'expect returned and passed values to match')
      )
  );

  return Promise.all([
    [ [1, Promise.resolve(2)], [1, 2] ],
    [ [Promise.resolve(1), Promise.resolve(2), ''], [1, 2, ''] ],
    [ [Promise.resolve(1), 'test'], [1, 'test']],
    [ [], [] ]
  ].map(testingFunction));
});


test(`co-handler maps the values and resolves the promises in an object`, () => {
  const testingFunction = ([arg, expected]) => (
    coHandler(arg)
      .then( result => assert.deepEqual(result, expected, 'expect returned and passed values to match') )
  );

  return Promise.all([
    [ {a: 1, b: Promise.resolve(2)}, {a: 1, b: 2} ],
    [ {a: Promise.resolve(1), b: Promise.resolve(2), c: ''}, {a: 1, b: 2, c: ''} ],
    [ {a: Promise.resolve(1), b: 'test'}, {a: 1, b: 'test'} ],
    [ {}, {} ]
  ].map(testingFunction));
});


test(`co-handler runs the generator function with run() if it is passed`, () => {
  const testingFunction = ([arg, expected]) => (
    coHandler(arg)
      .then( result => assert.deepEqual(result, expected, 'expect returned and passed values to match') )
  );

  return Promise.all([
    [ function* (){ yield 'test'}, 'test' ],
    [ function* (){
      let val = (yield 1) + 1;
      yield Promise.resolve(val + 1);
    }, 3 ]
  ].map(testingFunction));
});


test(`co-handler resovles with identity on other types, and plain arrays and objects`, () => {
  const testingFunction = arg => (
    coHandler(arg)
    .then(result => { assert.deepEqual(result, arg); })
  );

  return Promise.all([
    123,
    'test',
    {a: 1, b: 2},
    [1, 2, 3],
    null,
    undefined
  ].map(testingFunction));
});




