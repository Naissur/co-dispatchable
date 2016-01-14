import Promise from 'bluebird';
import is from 'is';
import {isPromise} from '../utils';
import combineYieldTransforms from '../combine';
import runCo from '../co-dispatchable';

export default combineYieldTransforms([
  runCo,
  arrayToPromise,
  objectToPromise,
  x => x
]);

function arrayToPromise(arr) {
  if (!is.array) throw 'not an array';

  return Promise.all(arr.map(
    val => isPromise(val) ? Promise.resolve(val) : val
  ));
}

function objectToPromise(obj) {
  if (!isObject(obj)) throw 'not an object';

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
  return Promise.all(promises).then(function () {
    return results;
  });

  function defer(promiseToDefer, promiseKey) {
    // predefine the key in the result
    results[promiseKey] = undefined;
    promises.push(promiseToDefer.then(function (res) {
      results[promiseKey] = res;
    }));
  }
}


const isObject = val =>  (
  Object == val.constructor
)
