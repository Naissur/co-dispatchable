require('babel-polyfill');

import {test} from 'tap';
import jsc from 'jsverify';
import {log, isPromise, isGenerator, isGeneratorFunction} from './utils';
import bluebirdPromise from 'bluebird';

test('log invokes console.log with the passed arguments', assert => {
  const testingFunction = args => {
    global.console.log = (...calledWith) => {
      assert.deepEqual(calledWith, args, 'called with the wrong args');
    }
    log(...args);
    return true;
  };

  const tests = jsc.forall(
    '[json]', args => testingFunction(args)
  );

  jsc.assert(tests, {tests: 20});
  assert.end();
});

test(`isPromise returns false on non-Promise's`, assert => {
  [ 
    123, {}, [], '', undefined, null
  ].forEach(arg => {
    assert.equal(isPromise(arg), false, 'returns false');
  });

  assert.end();
});

test(`isPromise returns true on bluebird and native (if they are defined) Promise's`, assert => {
  if (Promise) {
    assert.equal(isPromise(Promise.resolve()), true, 'returns true on native promises');
  }
  assert.equal(isPromise(bluebirdPromise.resolve()), true, 'returns true on bluebird promises');

  assert.end();
});


test(`isGenerator returns false on non-Generator's`, assert => {
  [ 
    123, {}, [], '', undefined, null, () => {}, (function* () {})
  ].forEach(arg => {
    assert.equal(isGenerator(arg), false, 'returns false');
  });

  assert.end();
});

test(`isGenerator returns true on Generator's`, assert => {
  assert.equal(isGenerator( (function* () {})() ), true, 'returns true');

  assert.end();
});


test(`isGeneratorFunction returns false on non-GeneratorFunction's`, assert => {
  [ 
    123, {}, [], '', undefined, null, () => {}
  ].forEach(arg => {
    assert.equal(isGenerator(arg), false, 'returns false');
  });

  assert.end();
});

test(`isGeneratorFunction returns true on GeneratorFunction's`, assert => {
  assert.equal( isGeneratorFunction(function* () {}) , true, 'returns true');

  assert.end();
});

