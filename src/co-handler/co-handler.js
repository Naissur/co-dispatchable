import Promise from 'bluebird';
import is from 'is';
import {isPromise} from '../utils';
import combineYieldTransforms from '../combine';
// import {isGeneratorFunction} from '../utils';
// import runCo from '../co-dispatchable';

import {values} from 'ramda';
import {Maybe} from 'ramda-fantasy';
const {Just, Nothing} = Maybe;

export default combineYieldTransforms([
  // wrapPromiseValue,
  objectToPromise,
  arrayOfPromises,
  // generatorFunctionToPromise,
  x => Just(x)
]);

function arrayOfPromises(arr) {
  if (!isArrayOfPromises(arr)) return Nothing();

  return Just(Promise.all(arr));
}

function isArrayOfPromises(arr) {
  if (!is.array(arr)) return false;

  const promisesCount = arr
    .map(isPromise)
    .filter(x => (x === true))
    .length;

  return promisesCount > 0;
}


// TODO refactor
function objectToPromise(obj) {
  if (!isObjectWithPromises(obj)) return Nothing();

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
  return Just(Promise.all(promises).then(() => results));

  function defer(promiseToDefer, promiseKey) {
    // predefine the key in the result
    results[promiseKey] = undefined;
    promises.push(promiseToDefer.then(function (res) {
      results[promiseKey] = res;
    }));
  }
}

function isObjectWithPromises(obj) {
  if (!is.object(obj)) return false;

  const vals = values(obj);
  return isArrayOfPromises(vals);
}


/*
function generatorFunctionToPromise(x) {
  if (!isGeneratorFunction(x)) return Nothing();

  return Just(runCo(x));
}
*/


/*
function wrapPromiseValue(x) {
  if (!isPromise(x)) throw new Error('not a promise');
  
  return Promise.resolve( () => x );
}

const isObject = val =>  (
  Object == val.constructor
)
*/
