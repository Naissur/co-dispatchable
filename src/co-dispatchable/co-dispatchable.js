import is from 'is';
import Promise from 'bluebird';
import {isPromise, isGeneratorFunction} from '../utils';

export default function run(generatorFunc, transformYield = (x => x)) {
  if (!isGeneratorFunction(generatorFunc)) {
    throw `run: ${ JSON.stringify(generatorFunc) } is not a valid generator function`;
  }

  if (!is.fn(transformYield)) {
    throw `run: ${ JSON.stringify(transformYield) } is not a valid function`;
  }

  return new Promise(
    (resolve, reject) => {
      const it = generatorFunc();
      onFulfill(it);

      function onFulfill(val){
        let ret;

        try {
          ret = it.next(val);
        } catch (e) {
          return reject(`run: an unhandled error was thrown by the generator: ${e}`);
        }
        next(ret);
      }

      function onReject(err){
        let ret;

        try {
          ret = it.throw(err);
        } catch (e) {
          return reject(`run: an unhandled error was thrown by the generator: ${e}`);
        }

        next(ret);
      }

      function next(ret) {
        const transformedValue = transformYield(ret.value);
        if (!ret.done) {
          if (isPromise(transformedValue)) {
            transformedValue.then( onFulfill, onReject );
          } else {
            setTimeout( () => { onFulfill(transformedValue) }, 0);
          }
        } else {
          resolve(transformedValue);
        }
      }
    });
}


