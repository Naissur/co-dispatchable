export function log(...args){
  if (console){
    console.log(...args);
  }
};

export function isPromise(x) {
  return ('function' === typeof (x || {}).then);
}
