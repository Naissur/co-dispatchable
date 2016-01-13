import is from 'is';

export function log(...args){
  if (console){
    console.log(...args);
  }
};

export function isPromise(x) {
  return ('function' === typeof (x || {}).then);
}

export function isGenerator(x) {
  return 'function' == typeof (x || {}).next && 'function' == typeof (x || {}).throw;
}

export function isGeneratorFunction(x) {
  if (!is.defined(x)) return false;
  const constructor = x.constructor;
  if (!constructor) return false;
  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
  return isGenerator(constructor.prototype);
}
