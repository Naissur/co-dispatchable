require('babel-polyfill');
import run from './co-dispatchable';
import is from 'is';
// import jsc from 'jsverify';
import assert from 'assert';

import {expectToFailWith} from '../test-utils';
import {test} from 'tap';
import Promise from 'bluebird';
import combine from '../combine';

import {Maybe} from 'ramda-fantasy';
const {Just, Nothing} = Maybe;

test('run exists', t => {
  t.equal(is.defined(run), true);
  t.end();
});

test('run throws correct error when called with invalid args not with a function', () => {
  const firstArgTestingFunction = args => 
        expectToFailWith(
          Promise.attempt(() => run(...args)),
          `run: ${ JSON.stringify(args[0]) } is not a valid generator function`
        );

  const secondArgTestingFunction = args => 
        expectToFailWith(
          Promise.attempt(() => run(...args)),
          `run: ${ JSON.stringify(args[1]) } is not a valid function`
        );

  const firstArgTests = [ 
    [123], [{}], [[]], ['']
  ].map(firstArgTestingFunction);

  const secondArgTests = [
    [function* () {}, 123], 
    [function* () {}, {}],
    [function* () {}, []], 
    [function* () {}, '']
  ].map(secondArgTestingFunction);

  return Promise.all([...firstArgTests, ...secondArgTests]);
});

test('run returns a promise', t => {
  const result = run(function* () {});
  
  if (is.defined(result.then)) { t.pass(); } else { t.fail(); }
  t.end();
});


test('run takes a generator, and invokes its .next()', t => {
  const testValue = 'test';
  let called = false;

  const generator = function* () {
    called = true;
    yield testValue;
  }

  run(generator);

  setTimeout(() => {
    t.equal(called, true);
    t.end();
  }, 0);
});

test(`run's promise gets rejected if the yield handler returns [Nothing], with the correct error`, () => {
  const TEST_VALUE = {a: 1, b: 2};


  const generator = function* () { yield TEST_VALUE; };
  const transformYield = () => Nothing();


  return expectToFailWith(
    run(generator, transformYield),
    `run: transformYield didn't resolve on ${JSON.stringify(TEST_VALUE, null, ' ')}`
  );
});




test(`run's promise gets rejected if the generator throwed unhandled error, with the correct message`, () => {
  const TEST_ERROR = 'test error';

  return run(function* () {
    throw TEST_ERROR;
  }).then(
    () => {throw 'expected to fail'},
    err => {
      assert.equal(err, `run: an unhandled error was thrown by the generator: ${TEST_ERROR}`);
    });
});


test(`run's promise gets rejected if the yielded promise rejection has not been handled`, () => {
  const TEST_ERROR = 'test error';

  return run(function* () {
    let expectedResult = yield (Promise.reject(TEST_ERROR));
    return expectedResult;
  }).then(
    () => {throw 'expected to fail'},
    err => {
      assert.equal(err, `run: an unhandled error was thrown by the generator: ${TEST_ERROR}`);
    });
});



test('run resumes the passed generator with a result of yieldHandler applied to the yield expression returned value', () => {
  const TEST_VALUE = 'TEST_VALUE';
  const TEST_YIELD_VALUE = 'TEST_YIELD_VALUE';

  const generator = function* () { 
    const yielded = yield TEST_VALUE;

    if (yielded === TEST_YIELD_VALUE) return true;
    throw 'got the wrong yielded value';
  };
  const yieldHandler = combine([
    value => (value == TEST_VALUE) ? Just(TEST_YIELD_VALUE) : Nothing(),
    val => Just(val)
  ]);


  return run(generator, yieldHandler);
});


test('run handles yielded promises', () => {
  const TEST_VALUE = 'TEST_VALUE';
  const TEST_YIELD_VALUE = 'TEST_YIELD_VALUE';

  const generator = function* () { 
    const yielded = yield TEST_VALUE;

    if (yielded === TEST_YIELD_VALUE) return true;
    throw 'got the wrong yielded value';
  };
  const yieldHandler = combine([
    value => (value == TEST_VALUE) ? Just(Promise.resolve(TEST_YIELD_VALUE)) : Nothing(),
    val => Just(val)
  ]);


  return run(generator, yieldHandler);
});



test(`run's promise gets rejected if the returned promises fails, with the same error`, () => {
  const TEST_VALUE = 'TEST_VALUE';
  const TEST_ERROR = 'TEST_ERROR';

  const generator = function* () { 
    try {
      yield TEST_VALUE;
    } catch (e) {
      if (e == TEST_ERROR) return true;
    }

    throw `did't throw an error`;
  };
  const yieldHandler = combine([
    x => (x == TEST_VALUE) ? Just(Promise.reject(TEST_ERROR)) : Nothing(),
    x => Just(x)
  ]);


  return run(generator, yieldHandler);
});



test('run runs a generator in a loop, invoking its .next() until it runs out of input', () => {
  const TEST_VALUE_1 = 'TEST_VALUE_1';
  const TEST_VALUE_2 = 'TEST_VALUE_2';
  const TEST_VALUE_3 = 'TEST_VALUE_3';
  const SUCCESS = 'SUCCESS';

  const generator = function* () {
    const first = yield TEST_VALUE_1;
    if (first !== TEST_VALUE_1) throw 'first transformed yield value is incorrect';

    const second = yield TEST_VALUE_2;
    if (second !== TEST_VALUE_2) throw 'second transformed yield value is incorrect';

    const third = yield TEST_VALUE_3;
    if (third !== TEST_VALUE_3) throw 'third transformed yield value is incorrect';

    return SUCCESS;
  }

  return run(generator)
        .then( result => {
          assert.equal(result, SUCCESS);
          return true;
        });
});


