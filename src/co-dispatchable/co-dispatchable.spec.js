require('babel-polyfill');
import run from './co-dispatchable';
import is from 'is';
import jsc from 'jsverify';
import assert from 'assert';

import {expectToFailWith} from '../test-utils';
import {test} from 'tap';
import Promise from 'bluebird';

test('run exists', assert => {
  assert.equal(is.defined(run), true);
  assert.end();
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

test('runcli returns a promise', assert => {
  const result = run(function* () {}, () => {});
  
  if (is.defined(result.then)) { assert.pass(); } else { assert.fail(); }
  assert.end();
});


test('run takes a generator, and invokes its .next()', assert => {
  const test = 'test';
  let called = false;

  const generator = function* () {
    called = true;
    yield test;
  }

  run(generator, () => {});

  setTimeout(() => {
    assert.equal(called, true);
    assert.end();
  }, 0);
});

test('run returns a promise, which rejects if the passed generator throws error, with the same error', () => {
  const ERROR = 'some error';

  const generator = function* () {
    throw ERROR;
  }

  const promise = run(generator, () => {});

  return expectToFailWith(
    promise, ERROR
  );
});

test('run resumes the passed generator with a result of yieldHandler applied to the yield expression returned value', () => {
  const tests = jsc.forall(
     'json', 'json',
    (testYield, testYieldHandlerReturnValue) => (
      (function(testYield, testYieldHandlerReturnValue){
        let resumedWith;

        const generator = function* () { resumedWith = yield testYield; }
        const yieldHandler = value => ( value === testYield ? testYieldHandlerReturnValue : null);

        return run(generator, yieldHandler)
              .then( () => {
                assert.equal(resumedWith, testYieldHandlerReturnValue);
                return true;
              });
      })(testYield, testYieldHandlerReturnValue)
    )
  );

  return jsc.assert(tests, {tests: 20});
});


test('run resumes the passed generator with a resolved value of ' +
     'yieldHandler applied to the yield expression return value, if yieldHandler returns a Promise', () => {

  const tests = jsc.forall(
     'json', 'json',
    (testYield, yieldHandlerPromiseValue) => (
      (function(testYield, yieldHandlerPromiseValue){
        let resumedWith;

        const generator = function* () { resumedWith = yield testYield; }
        const yieldHandler = value => ( value === testYield ? Promise.resolve(yieldHandlerPromiseValue) : null);

        return run(generator, yieldHandler)
              .then( () => {
                assert.equal(resumedWith, yieldHandlerPromiseValue);
                return true;
              });
      })(testYield, yieldHandlerPromiseValue)
    )
  );

  return jsc.assert(tests, {tests: 20});
});

test('run runs correctly with yielded promises and identity yield handler', () => {
  const testValue = 'testValue';
  const test = Promise.resolve(testValue);
  let resumedWith;

  const generator = function* () { resumedWith = yield test; }

  return run(generator, x => x)
        .then( () => {
          assert.equal(resumedWith, testValue);
        });
});

test(`run's promise rejects if one of yielded promises fails with the same error`, () => {
  const tests = jsc.forall( 'json',
    testError => (function(testError){
      const test = Promise.reject(testError);

      const generator = function* () { yield test; }

      return run(generator)
            .then( () => {
              throw 'Expected to fail';
            }, err => {
              assert.equal(err, testError);
              return true;
            });
    })(testError)
  );
  
  return jsc.assert(tests, {tests: 20});
});


test('run runs a generator in a loop, invoking its .next() until it runs out of input', () => {
  const tests = jsc.forall(
    'json', 'json',
    (testValue, testYieldHandlerValue) => (function(testValue, testYieldHandlerValue) {
      let timesCalled = 0;

      const generator = function* () {
        timesCalled++;
        yield testValue;
        timesCalled++;
        yield Promise.resolve(testValue);
        timesCalled++;
        yield testValue;
      }

      const yieldHandler = x => x == testValue ? testYieldHandlerValue : null;

      return run(generator, yieldHandler)
            .then( result => {
              assert.equal(result, testYieldHandlerValue);
              assert.equal(timesCalled, 3);
              return true;
            });
    })(testValue, testYieldHandlerValue)
  );

  return jsc.assert(tests, {tests: 20});
});

test('run resolves the returned promise with the last yielded value', () => {
  const tests = jsc.forall(
    'json', 'json',
    (testValue, testYieldHandlerValue) => (function(testValue, testYieldHandlerValue) {
      const generator = function* () {
        yield '';
        yield Promise.resolve(null);
        yield testValue;
      }

      const yieldHandler = x => x == testValue ? testYieldHandlerValue : null;

      return run(generator, yieldHandler)
            .then( result => {
              assert.equal(result, testYieldHandlerValue);
              return true;
            });
    })(testValue, testYieldHandlerValue)
  );

  return jsc.assert(tests, {tests: 20});
});

