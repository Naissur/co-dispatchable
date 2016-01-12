import is from 'is';
import Promise from 'bluebird';

const wrapInTransformResult = promise => 
  (promise.then(
    val => ({ success: true,  value: val }),
    err => ({ success: false, value: err })
  ));

export default function(transforms) {
  return value => {
    if ( (!is.array(transforms)) || (transforms.length == 0) ) {
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

