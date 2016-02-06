require('babel-polyfill');
import {test} from 'tap';
import is from 'is';
import coHandler from './co-handler';
import Promise from 'bluebird';
import assert from 'assert';

// import {Maybe} from 'ramda-fantasy';
// const {getOrElse, Just, Nothing} = Maybe;


test('co-handler is a function', t => {
  t.equal(is.fn(coHandler), true, 'it is a function');
  t.end();
});


test('co-handler returns a Promise.all call result if called with an array of promises', () => {
  const testValues = [ 1, 2 ];
  const testPromises = testValues.map(Promise.resolve);

  return coHandler(testPromises)
    .getOrElse('Error: expected to return a Just Maybe instance')
    .then(results => {
      assert.deepEqual(results, testValues, 'result is equal to the initial array');
      return true;
    })
});


test(`co-handler maps the values and resolves the promises in the array`, () => {
  const testingFunction = ([arg, expected]) => (
    coHandler(arg)
      .getOrElse('Error: expected to return a Just Maybe instance')
      .then(
        result => assert.deepEqual(result, expected, 'expect returned and passed values to match')
      )
  );

  return Promise.all([
    [ [1, Promise.resolve(2)], [1, 2] ],
    [ [Promise.resolve(1), Promise.resolve(2), ''], [1, 2, ''] ],
    [ [Promise.resolve(1), 'test'], [1, 'test']]
  ].map(testingFunction))
  .then( 
    () => true,
    () => Promise.reject('one failed')
  );
});



test(`co-handler returns a promise which gets rejected if one of the promises in the array were rejected`, () => {
  const testingFunction = ([arg, expected]) => (
    coHandler(arg)
      .getOrElse('Error: expected to return a Just Maybe instance')
      .then(
        () => { throw 'expected to fail' },
        result => assert.deepEqual(result, expected, 'expect returned and passed values to match')
      )
  );

  return Promise.all([
    [ [1, Promise.reject(2)], 2 ],
    [ [Promise.reject(1), Promise.resolve(2), ''], 1 ],
    [ [Promise.resolve(1), 'test', Promise.reject('test')], 'test']
  ].map(testingFunction));
});



test(`co-handler maps the values and resolves the promises in an object`, () => {
  const testingFunction = ([arg, expected]) => (
    coHandler(arg)
      .getOrElse('Error: expected to return a Just Maybe instance')
      .then( result => assert.deepEqual(result, expected, 'expect returned and passed values to match') )
  );

  return Promise.all([
    [ {a: 1, b: Promise.resolve(2)}, {a: 1, b: 2} ],
    [ {a: Promise.resolve(1), b: Promise.resolve(2), c: ''}, {a: 1, b: 2, c: ''} ],
    [ {a: Promise.resolve(1), b: 'test'}, {a: 1, b: 'test'} ]
  ].map(testingFunction));
});


/*


test(`co-handler runs the generator function with run() if it is passed`, () => {
  const testingFunction = ([arg, expected]) => (
    coHandler(arg)
      .then( result => assert.deepEqual(result, expected, 'expect returned and passed values to match') )
  );

  return Promise.all([
    [ function* (){ return 'test'}, 'test' ],
    [ function* (){
      let val = (yield 1) + 1;
      return Promise.resolve(val + 1);
    }, 3 ]
  ].map(testingFunction));
});

*/



/*
test(`co-handler resovles with identity on other types, and plain arrays and objects`, () => {
  const testingFunction = arg => (
    coHandler(arg)
      .getOrElse('Error: expected to return a Just Maybe instance')
      .then(result => assert.deepEqual(result, arg))
  );

  return Promise.all([
    123,
    'test',
    {a: 1, b: 2},
    [1, 2, 3]
  ].map(testingFunction));
});

test(`co-handler with run() allows generator to try/catch promise errors`, () => {
  const TEST_ERROR = 'boom';

  return run(function* (){
    try {
      yield Promise.reject(TEST_ERROR);
    } catch (err) {
      assert.deepEqual(TEST_ERROR, err);
      return true;
    }
    return false;
  }, coHandler)
    .then(x => {
      assert.equal(x, true);
    });
});

*/

