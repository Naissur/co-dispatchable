require('babel-polyfill');
import is from 'is';
import combineYieldTransforms from './combineYieldTransforms';

import jsc from 'jsverify';
import assert from 'assert';
// import {expectToFailWith} from './testUtils';
import test from 'blue-tape';
// import Promise from 'bluebird';

test('combineYieldTransforms exports a function by default', assert => {
  assert.equal(is.fn(combineYieldTransforms), true);
  assert.end();
});

test('combineYieldTransforms always returns a function, returning a Promise', assert => {
  const result = combineYieldTransforms([])();
  if (is.defined(result.then)) {
    assert.pass();
  } else {
    assert.fail();
  }

  assert.end();
});

test('combineYieldTransforms is the identity transform if called without arguments', () => {
  const result = combineYieldTransforms([]);

  const tests = jsc.forall(
    'json',
    test => (
      result(test).then(
        value => assert.equal(value, test)
      )
      .then(() => true)
    )
  );

  return jsc.assert(tests, {tests: 20});
});

test('combineYieldTransforms handles single identity transform', assert => {
  const combine = combineYieldTransforms([x => x]);

  const tests = jsc.forall(
    'json',
    test => (
      combine(test).then(
        value => assert.equal(value, test)
      )
      .then(() => true)
    )
  );

  return jsc.assert(tests, {tests: 20});
});

test('combineYieldTransforms takes the first returned value when passed synchronous transforms, if all of them were resolved', () => {
  const firstTransform = x => {
    if (x === 1) return 2;
  };
  const secondTransform = x => {
    if (x === 2) return 3;
  };

  const combination = combineYieldTransforms([firstTransform, secondTransform]);

  return Promise.all([
    combination(1),
    combination(2)
  ]).then( ([first, second]) => {
    assert.equal(first, 2);
    assert.equal(is.defined(second), false);
  });
});


test('combineYieldTransforms returns a rejected promise with the correct error if all transforms were rejected', () => {
  const firstTransform = () => {
    throw 'error';
  };
  const secondTransform = () => {
    throw 'error';
  };

  const combination = combineYieldTransforms([firstTransform, secondTransform]);

  return combination('test')
        .then( () => {
          throw 'Expected to fail';
        }, error => {
          assert.equal(error, 'combineYieldTransforms error: none of the transforms resolved');
        });
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

