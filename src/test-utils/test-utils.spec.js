import {test} from 'tap';
import {expectToFail, expectToFailWith} from './test-utils';
import Promise from 'bluebird';
import assert from 'assert';
import jsc from 'jsverify';

test('expectToFail throws correct error if the first argument is not a promise', () => {
  const test = promise => 
          Promise.attempt(() => expectToFail(promise))
          .then( () => {
            throw 'Expected to fail';
          }, reason => {
            assert.equal(reason, `expectToFail: ${JSON.stringify(promise)} is not a Promise`);
            return true;
          });
        

  const tests = [ 
    123, {}, [], '', () => {}
  ].map(test);

  return Promise.all(tests);
});

test('expectToFail fails if the promise resolves (w/o descriptor)', () => {
  return expectToFail(Promise.resolve())
        .then( () => {
          throw 'expected to fail';
        },
        reason => {
          assert.equal(reason, `Expected to fail`);
        }
      );
});

test('expectToFail fails with correct description if the promise resolves', () => {
  const tests = jsc.forall(
    'asciinestring', descriptor => (
      expectToFail(Promise.resolve(), descriptor)
          .then(() => { throw 'expected to fail'; },
                reason => { 
                  assert.equal(reason, `Expected to fail on ${descriptor}`);
                  return true; 
                }
          )
    )
  );

  return jsc.assert(tests, {tests: 20});
});

test('expectToFail succeeds if the passed promise gets rejected', () => {
  return expectToFail(Promise.reject())
          .then( 
            () => true,
            () => { throw 'expected to fail'; }
          );
});





test('expectToFailWith fails with the correct error if the first argument is not a promise', () => {
  const test = promise => 
          Promise.attempt(() => expectToFailWith(promise))
          .then( () => {
            throw 'Expected to fail';
          }, reason => {
            assert.equal(reason, `expectToFailWith: ${JSON.stringify(promise)} is not a Promise`);
            return true;
          });
        
  const tests = [ 
    123, {}, [], '', () => {}
  ].map(test);

  return Promise.all(tests);
});


test('expectToFailWith fails with the correct error if the promise resolves', () => {
  const tests = jsc.forall(
   'asciinestring', expectedError => 
        expectToFailWith(Promise.resolve(), expectedError)
        .then( () => {
          throw 'expected to fail';
        },
        reason => {
          assert.equal(reason, `Expected to fail with ${ expectedError }, instead passed`);
          return true;
        }
      )
  );

  return jsc.assert(tests, {tests: 20});
});

test('expectToFailWith fails with the correct error if the promise rejects with a different error', () => {
  const tests = jsc.forall(
   'asciinestring', expectedError => 
        expectToFailWith(Promise.reject(`${expectedError}_`), expectedError)
        .then( () => {
          throw 'expected to fail';
        },
        reason => {
          assert.equal(reason, `Expected to fail with ${ expectedError }, instead got ${ expectedError+'_' }`);
          return true;
        }
      )
  );

  return jsc.assert(tests, {tests: 20});
});


test('expectToFail succeeds if the promise resolves with correct description', () => {
  const tests = jsc.forall(
   'asciinestring', expectedError => 
        expectToFailWith(Promise.reject(expectedError), expectedError)
          .then( () => { return true; },
          () => { throw 'expected to pass'; }
      )
  );

  return jsc.assert(tests, {tests: 20});
});

