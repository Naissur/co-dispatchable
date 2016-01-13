import is from 'is';
import Promise from 'bluebird';

const wrapInTransformResult = promise => 
  (promise.then(
    val => ({ success: true,  value: val }),
    err => ({ success: false, value: err })
  ));

export default function(transforms) {
  assertArrayOfFunctions(transforms);

  return value => {
    if ( (transforms.length == 0) ) {
      return Promise.resolve(value);
    }

    const transformPromises = transforms.map(
      transform => ( wrapInTransformResult(Promise.attempt(() => transform(value))) ) //wraping is needed for running Promise.all()
    );

    return Promise.all(transformPromises)
      .then(results => {
        const successfulResultValues = results.filter(result => result.success)
                                              .map(result => result.value);

        if (successfulResultValues.length === 0) {
          throw 'combineYieldTransforms error: none of the transforms resolved';
        }

        return successfulResultValues[0];
      })
  };
}


function assertArrayOfFunctions(fns) {
  if (!is.array(fns)) { throw `combineYieldTransforms error: ${ JSON.stringify(fns) } is not an array`; }

  for (let i = 0; i < fns.length; i++) {
    const fn = fns[i];
    if (!is.fn(fn)) { throw `combineYieldTransforms error: ${ JSON.stringify(fn) } is not a function` }
  }
}
