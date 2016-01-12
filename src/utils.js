const clc = require('cli-color');
const jsdiff = require('diff');
import is from 'is';

export function logFunctionExecution(logStartMessage, logEndMessageFromMs, logErrorMessageFromError, fn) {
  const timeStarted = new Date();
  logStartMessage();

  let result;

  try {
    result = fn();

    if (is.defined(result) && is.defined(result.then)) { //if returns a promise
      return result.then(
        () => {
          const ms = ((new Date()) - timeStarted);
          logEndMessageFromMs(ms);
        },
        error => logErrorMessageFromError(error)
      )
    }

    const ms = ((new Date()) - timeStarted);
    logEndMessageFromMs(ms);

  } catch (e) {
    logErrorMessageFromError(e)
  }

  return result;
}

export function logPrettyLinesDiff(a, b) {
  const diff = jsdiff.diffLines(a, b);

  diff.forEach( part => {
    // green for additions, red for deletions
    // grey for common parts
    const color = part.added ? 'green' :
                  part.removed ? 'red' : 'blackBright';
    process.stderr.write(clc[color](part.value));
  });

  console.log();
}

export function logPrettyCharsDiff(a, b) {
  const diff = jsdiff.diffChars(a, b);

  diff.forEach( part => {
    // green for additions, red for deletions
    // grey for common parts
    const color = part.added ? 'green' :
                  part.removed ? 'red' : 'blackBright';
    process.stderr.write(clc[color](part.value));
  });

  console.log();
}

export function log(){
  this.history = this.history || [];   // store logs to an array for reference
  this.history.push(arguments);

  if (console){
    console.log( Array.prototype.slice.call(arguments) );
  }
};
