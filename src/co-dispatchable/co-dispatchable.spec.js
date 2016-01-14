require('babel-polyfill');
import run from './co-dispatchable';
import is from 'is';
import jsc from 'jsverify';
import assert from 'assert';

import {expectToFailWith} from '../test-utils';
import {test} from 'tap';
import Promise from 'bluebird';

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

test('runcli returns a promise', t => {
  const result = run(function* () {}, () => {});
  
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

  run(generator, () => {});

  setTimeout(() => {
    t.equal(called, true);
    t.end();
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
    (_testYield, _testYieldHandlerReturnValue) => (
      (function(testYield, testYieldHandlerReturnValue){
        let resumedWith;

        const generator = function* () { resumedWith = yield testYield; }
        const yieldHandler = value => ( value === testYield ? testYieldHandlerReturnValue : null);

        return run(generator, yieldHandler)
              .then( () => {
                assert.equal(resumedWith, testYieldHandlerReturnValue);
                return true;
              });
      })(_testYield, _testYieldHandlerReturnValue)
    )
  );

  return jsc.assert(tests, {tests: 20});
});


test('run resumes the passed generator with a resolved value of ' +
     'yieldHandler applied to the yield expression return value, if yieldHandler returns a Promise', () => {

  const tests = jsc.forall(
     'json', 'json',
    (_testYield, _yieldHandlerPromiseValue) => (
      (function(testYield, yieldHandlerPromiseValue){
        let resumedWith;

        const generator = function* () { resumedWith = yield testYield; }
        const yieldHandler = value => ( value === testYield ? Promise.resolve(yieldHandlerPromiseValue) : null);

        return run(generator, yieldHandler)
              .then( () => {
                assert.equal(resumedWith, yieldHandlerPromiseValue);
                return true;
              });
      })(_testYield, _yieldHandlerPromiseValue)
    )
  );

  return jsc.assert(tests, {tests: 20});
});

test('run runs correctly with yielded promises and identity yield handler', () => {
  const testValue = 'testValue';
  const testPromise = Promise.resolve(testValue);
  let resumedWith;

  const generator = function* () { resumedWith = yield testPromise; }

  return run(generator, x => x)
        .then( () => {
          assert.equal(resumedWith, testValue);
        });
});

test(`run's promise rejects if one of yielded promises fails with the same error`, () => {
  const tests = jsc.forall( 'json',
    _testError => (function(testError){
      const testPromise = Promise.reject(testError);

      const generator = function* () { yield testPromise; }

      return run(generator)
            .then( () => {
              throw 'Expected to fail';
            }, err => {
              assert.equal(err, testError);
              return true;
            });
    })(_testError)
  );
  
  return jsc.assert(tests, {tests: 20});
});


test('run runs a generator in a loop, invoking its .next() until it runs out of input', () => {
  const tests = jsc.forall(
    'json', 'json',
    (_testValue, _testYieldHandlerValue) => (function(testValue, testYieldHandlerValue) {
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
    })(_testValue, _testYieldHandlerValue)
  );

  return jsc.assert(tests, {tests: 20});
});

test('run resolves the returned promise with the last yielded value', () => {
  const tests = jsc.forall(
    'json', 'json',
    (_testValue, _testYieldHandlerValue) => (function(testValue, testYieldHandlerValue) {
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
    })(_testValue, _testYieldHandlerValue)
  );

  return jsc.assert(tests, {tests: 20});
});

