import Promise from 'bluebird';
import is from 'is';
import {isPromise} from '../utils';
import combineYieldTransforms from '../combine';
import {isGeneratorFunction} from '../utils';
import runCo from '../co-dispatchable';

export default combineYieldTransforms([
  // wrapPromiseValue,
  // generatorFunctionToPromise,
  arrayToPromise,
  // objectToPromise,
  x => ({result: true, value: x})
]);

function wrapPromiseValue(x) {
  if (!isPromise(x)) throw new Error('not a promise');
  
  return Promise.resolve( () => x );
}

function arrayToPromise(arr) {
  if (!is.array(arr)) throw new Error('not an array');

  return {
    result: true, value: Promise.all(arr)
  };
}

function objectToPromise(obj) {
  if (!isObject(obj)) throw new Error('not an object');

  var results = new obj.constructor();
  var keys = Object.keys(obj);
  var promises = [];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var promise = obj[key];
    if (promise && isPromise(promise)){
      defer(promise, key);
    } else {
      results[key] = obj[key];
    }
  }
  return Promise.resolve(() => 
    (Promise.all(promises).then(() => results))
  );

  function defer(promiseToDefer, promiseKey) {
    // predefine the key in the result
    results[promiseKey] = undefined;
    promises.push(promiseToDefer.then(function (res) {
      results[promiseKey] = res;
    }));
  }
}

function generatorFunctionToPromise(x) {
  if (!isGeneratorFunction(x)) throw new Error('not a generator function');

  return Promise.resolve(() => 
    runCo(x)
  );
}

const isObject = val =>  (
  Object == val.constructor
)
