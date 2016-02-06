require('babel-polyfill');
import is from 'is';
import combineYieldTransforms from './combine-yield-transforms';
// import {has} from 'ramda';

// import jsc from 'jsverify';
import {expectToFailWith} from '../test-utils';
import {test} from 'tap';
import Promise from 'bluebird';

import {Maybe} from 'ramda-fantasy';
const {Just, Nothing} = Maybe;



// =================================//
// =     transforms of depth 1    = //
// =================================//


test('combineYieldTransforms exports a function by default', t => {
  t.equal(is.fn(combineYieldTransforms), true);
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



test('combineYieldTransforms is the identity transform if called without arguments', t => {
  const transform = combineYieldTransforms([]);
  const TEST_VALUE = {test: 'test', anotherTest: 'anotherTest'};

  const got = transform(TEST_VALUE);
  const expected = Just(TEST_VALUE);

  t.deepEqual(got, expected);
  t.end();
});


test('combineYieldTransforms handles single identity transform', t => {
  const transform = combineYieldTransforms([x => Just(x)]);
  const TEST_VALUE = {test: 'test', anotherTest: 'anotherTest'};

  const got = transform(TEST_VALUE);
  const expected = Just(TEST_VALUE);

  t.deepEqual(got, expected);
  t.end();
});


test('combineYieldTransforms handles a single failing transform', t => {
  const TEST_VALUE = 'test value';
  const failingTransform = () => Nothing();
  const combined = combineYieldTransforms([failingTransform]);

  const got = combined(TEST_VALUE);

  t.assert(got.isNothing(), 'returns Nothing');
  t.end();
});


test('combineYieldTransforms handles two transforms - resolving with the first successful one', t => {
  const TEST_VALUE = 'test value';
  const identityTransform = x => Just(x);
  const failingTransform = () => Nothing();

  const combined = combineYieldTransforms([failingTransform, identityTransform]);


  const got = combined(TEST_VALUE);
  const expected = Just(TEST_VALUE);


  t.deepEqual(got, expected);
  t.end();
});



test('combineYieldTransforms handles two transforms - resolving with the first successful one (a more complex case)', t => {
  const firstTransform = x => {
    if (x === 1) return Just(2);
    return Nothing();
  };
  const secondTransform = x => {
    if (x === 2) return Just(3);
    return Just(4);
  };
  const combination = combineYieldTransforms([firstTransform, secondTransform]);


  t.deepEqual(combination(1), Just(2) );
  t.deepEqual(combination(2), Just(3) );
  t.deepEqual(combination(3), Just(4) );


  t.end();
});



test('combineYieldTransforms returns a {success: false} if all transforms were rejected', t => {
  const TEST_VALUE = 'test value';
  const failingTransform = () => Nothing();
  const combined = combineYieldTransforms([failingTransform, failingTransform]);

  const got = combined(TEST_VALUE);

  t.equal(got.isNothing(), true);
  t.end();
});



// ===================== //
// =      nesting      = //
// ===================== //



test(`combineYieldTransforms' composition is associative (allows for nesting)`, t => {
  const transforms = [
    x => (x === 2) ? Just(3) : Nothing(),
    x => (x === 1) ? Nothing() : Just(1),
    () => Just(2)
  ];
  const [first, second, third] = transforms;


  const testCombination = combinationResult => {
    t.deepEqual(combinationResult(0), Just(1) );
    t.deepEqual(combinationResult(1), Just(2) );
    t.deepEqual(combinationResult(2), Just(3) );
    t.deepEqual(combinationResult(3), Just(1) );
  }

  // tesing the associativity law
  [
    combineYieldTransforms(transforms),
    combineYieldTransforms([ combineYieldTransforms([first, second]), third ]),
    combineYieldTransforms([ first, combineYieldTransforms([second, third]) ]),
    combineYieldTransforms([ combineYieldTransforms([first]), combineYieldTransforms([second]), combineYieldTransforms([third]) ])
  ].forEach(testCombination);


  t.end();
});

