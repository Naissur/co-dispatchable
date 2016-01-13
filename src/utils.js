
export function log(){
  this.history = this.history || [];   // store logs to an array for reference
  this.history.push(arguments);

  if (console){
    console.log( Array.prototype.slice.call(arguments) );
  }
};

export function isPromise(x) {
  return ('function' === typeof (x || {}).then);
}
