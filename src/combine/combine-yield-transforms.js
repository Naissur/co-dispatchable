import is from 'is';

import {Maybe} from 'ramda-fantasy';
const {Just, Nothing} = Maybe;


export default function combineYieldTransforms(transforms) {
  assertArrayOfFunctions(transforms);

  return value => {
    const transformsEmpty = (transforms.length === 0);
    if (transformsEmpty) return Just(value);

    const successfulTransforms = transforms.map( transform => transform(value) )
                                           .filter(res => res.isJust());

    const hasSuccessful = successfulTransforms.length > 0;
    if (!hasSuccessful) return Nothing();

    const firstSuccessful = successfulTransforms[0];
    return firstSuccessful;
  };
}


function assertArrayOfFunctions(fns) {
  if (!is.array(fns)) { throw new Error(`combineYieldTransforms error: ${ JSON.stringify(fns) } is not an array`); }

  for (let i = 0; i < fns.length; i++) {
    const fn = fns[i];
    if (!is.fn(fn)) { throw new Error(`combineYieldTransforms error: ${ JSON.stringify(fn) } is not a function`); }
  }
}
