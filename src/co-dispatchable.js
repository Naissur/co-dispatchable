import is from 'is';
import Promise from 'bluebird';

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
      let ret;

      (function iterate(val){
        ret = it.next(val);
        const resumeWith = transformYield(ret.value);

        if (!ret.done) {
          if (isPromise(resumeWith)) {
            resumeWith.then( iterate, reject );
          } else {
            setTimeout( () => { iterate(resumeWith) }, 0);
          }
        } else {
          resolve(val);
        }
      })();
    });
}


function isPromise(x) {
  return (typeof x !== 'undefined') && (x !== null) && ('function' == typeof (x || {}).then);
}

function isGenerator(x) {
  return 'function' == typeof x.next && 'function' == typeof x.throw;
}

function isGeneratorFunction(x) {
  if (!is.defined(x)) return false;
  const constructor = x.constructor;
  if (!constructor) return false;
  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
  return isGenerator(constructor.prototype);
}
