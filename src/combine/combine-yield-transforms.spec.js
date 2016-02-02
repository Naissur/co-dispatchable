require('babel-polyfill');
import is from 'is';
import combineYieldTransforms from './combine-yield-transforms';

import jsc from 'jsverify';
import assert from 'assert';
import {expectToFailWith} from '../test-utils';
import {test} from 'tap';
import Promise from 'bluebird';

test('combineYieldTransforms exports a function by default', t => {
  t.equal(is.fn(combineYieldTransforms), true);
  t.end();
});


test('combineYieldTransforms always returns a function, returning a Promise', t => {
  const result = combineYieldTransforms([])();
  if (is.defined(result.then)) {
    t.pass();
  } else {
    t.fail();
  }

  t.end();
});


test('combineYieldTransforms throws a correct error if called with non-array', () => {
  const testingFunction = transforms => 
        expectToFailWith(
          Promise.attempt(() => combineYieldTransforms(transforms)),
          `combineYieldTransforms error: ${ JSON.stringify(transforms) } is not an array`
        );

  const tests = [
    '', {}, 123, null
  ].map(testingFunction);

  return Promise.all([...tests]);
});


test('combineYieldTransforms throws a correct error if called with invalid transforms', () => {
  const firstArgTestingFunction = transforms => 
        expectToFailWith(
          Promise.attempt(() => combineYieldTransforms(transforms)),
          `combineYieldTransforms error: ${ JSON.stringify(transforms[0]) } is not a function`
        );

  const secondArgTestingFunction = transforms => 
        expectToFailWith(
          Promise.attempt(() => combineYieldTransforms(transforms)),
          `combineYieldTransforms error: ${ JSON.stringify(transforms[1]) } is not a function`
        );

  const firstArgTests = [ 
    [123], [{}], [[]], ['']
  ].map(firstArgTestingFunction);

  const secondArgTests = [
    [() => {}, 123], 
    [() => {}, {}],
    [() => {}, []], 
    [() => {}, '']
  ].map(secondArgTestingFunction);

  return Promise.all([...firstArgTests, ...secondArgTests]);
});


test('combineYieldTransforms is the identity transform if called without arguments', () => {
  const result = combineYieldTransforms([]);

  const tests = jsc.forall(
    'json',
    testValue => (
      result(testValue).then(
        value => assert.equal(value, testValue)
      )
      .then(() => true)
    )
  );

  return jsc.assert(tests, {tests: 20});
});




test('combineYieldTransforms handles single identity transform', () => {
  const combine = combineYieldTransforms([x => x]);

  const tests = jsc.forall(
    'json',
    testValue => (
      combine(testValue).then(
        value => assert.equal(value, testValue)
      )
      .then(() => true)
    )
  );

  return jsc.assert(tests, {tests: 20});
});


test('combineYieldTransforms handles single promise-based identity transform', () => {
  const combine = combineYieldTransforms([x => Promise.resolve(() => x)]);

  const tests = jsc.forall(
    'json',
    testValue => (
      combine(testValue).then(
        value => assert.equal(value, testValue)
      )
      .then(() => true)
    )
  );

  return jsc.assert(tests, {tests: 20});
});


test('combineYieldTransforms handles transformations which resolve with promises, which later get rejected', () => {
  const TEST_ERROR = 'test error';
  const transform = () => (
    Promise.resolve(() => Promise.reject(TEST_ERROR))
  );

  return combineYieldTransforms([transform])()
          .then(
            () => {throw 'expected to be rejected'},
            x => { assert.equal(x, TEST_ERROR); }
          );
});


test('combineYieldTransforms returns a rejected promise with the correct error if all transforms were rejected', () => {
  const firstTransform = () => { throw 'error'; };
  const secondTransform = () => { throw 'error'; };

  const combination = combineYieldTransforms([firstTransform, secondTransform]);

  return expectToFailWith(
          Promise.attempt(() => combination('test')),
          'combineYieldTransforms error: none of the transforms resolved'
        );
});


test('combineYieldTransforms takes the first (by order) resolved transform when passed synchronous transforms', () => {
  const firstTransform = x => {
    if (x === 1) return 2;
    throw 'error';
  };
  const secondTransform = x => {
    if (x === 2) return 3;
    return 4;
  };

  const combination = combineYieldTransforms([firstTransform, secondTransform]);

  return Promise.all([
    combination(1),
    combination(2),
    combination(3)
  ]).then( ([first, second, third]) => {
    assert.equal(first, 2, 'first passes');
    assert.equal(second, 3, 'second passes');
    assert.equal(third, 4, 'third passes');
    return true;
  });
});



test('combineYieldTransforms handles the mixed type transforms', () => {
  const firstTransform = x => {
    if (x === 2) return 3;
    
    return Promise.reject();
  };
  const secondTransform = x => {
    if (x === 1) throw 'error';
    return 1;
  };
  const thirdTransform = () => {
    return 2;
  };

  const combination = combineYieldTransforms([firstTransform, secondTransform, thirdTransform]);

  return Promise.all([
    combination(0),
    combination(1),
    combination(2)
  ])
  .then( ([first, second, third]) => {
    assert.equal(first, 1);
    assert.equal(second, 2);
    assert.equal(third, 3);
  });
});

