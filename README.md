# co-dispatchable (WIP)
[![Build Status](https://travis-ci.org/Naissur/co-dispatchable.svg?branch=master)](https://travis-ci.org/Naissur/co-dispatchable)
[![Coverage Status](https://coveralls.io/repos/Naissur/co-dispatchable/badge.svg?branch=master&service=github)](https://coveralls.io/github/Naissur/co-dispatchable?branch=master)

Generator runner with support for custom yield transformations

# Why another co/bluebird.coroutine ?

The main purpose of this library is to improve the **testability and reusability of generators with asynchronous side-effects** by decoupling the generator control flow and side-effects producers.


### Motivation example

Suppose one needs to write a program which must:

- fetch server status by making an http request
- if the request resolves, to log the current number of users into a file with a timestamp
- if the request fails, to log the error

Leaving implemetation of `get`, `logInfo` and `logError` behind (they return Promises), the code might look like this:

```javascript
export const run = function* () {
  try {
    const serverData = yield get('http://test-1.url.com');
  } catch (e) {
    return logError(timestamp, `Server error: ${prettify(e)}`);
  }
  const timestamp = (new Date()).getTime();
  yield logInfo(timestamp, `Users count is ${serverData.useresCount}`);
};

...

co(run);
```

Testing the `run` function involves, in the successful case:

- asserting that `get` is invoked with the correct arguments
- resolving the mocked promise returned by `get` with a stubbed response
- `then` asserting that logInfo is invoked with the correct params

and in the error case:

- asserting that `get` is invoked with the correct arguments
- rejecting the mocked promise returned by `get` with a stubbed response
- `then` asserting that logError is invoked with the correct params

If there were more steps, there would have been more checking of the invoked params, and chained `.then` asserts.



### A different approach

The idea is to make the following changes:

- `get`, `logInfo` and `logError` should only return the **descriptors** (plain JSON) of the actions involving side-effects
- the function called `handler` takes care of actually invoking side-effects when invoked with their descriptors 
- the generator runner is responsible for taking the yielded value, passing it to the yield handler, and resuming the generator with the returned result

The way to tell the generator how to handle different yielded values is to pass the `yieldHandler` function. It must be a function takes in a yielded expression, runs the side-effects, and returns a promise which gets fulfilled with the results.

### The consequences

Making this change enables to **test the generator control flow synchronously**, and to test the side-effects of yield handlers separately. This is because the generator itself does not produce any side-effects: the only thing it does is to synchronously return their descriptors. So testing steps for the success case now look like this:

- run the generator once, and ensure that the returned action descriptor has the correct url
- invoke `generator.next()` with a mocked response
- assert that the correct `logInfo` action descriptor is then returned

The side-effects of `get`, `logInfo`, `logError` and their runners are tested separately.

# Default handler

A default yield handler (`co-dispatchable/co-handler`) is provided (much like `co`'s), which handles:

- **promises**
- **arrays with promise values** - substitutes the promises for the values they resolved with
- **objects with promise values** - the same way as with arrays
- **generator functions** - `run`s the generator, and resumes the root generator with the returned value

If none cases were matched, the yielded value remains unchanged.


# API

##### note: the Maybe type is imported from ![ramda-fantasy](https://www.npmjs.com/package/ramda-fantasy)


## Functions


#### run(generatorFunc: GeneratorFunction, transformYield: YieldTransformer) : Promise

Runs the generator, resuming it with the transformed `yield` values (either synchronously, or asynchronously).


#### combineYieldTransforms(transforms: [ YieldTransformer ]) : YieldTransformer

A helper function for combining the yield transforms.

It returns a transform function which, when tested against some yield, calls all of the transforms and resolves with the value returned by the first (by order) successful one. If all of the transforms fail, it returns `Nothing`.


## Types


#### YieldTransformer : a -> Maybe (b | Promise b)

A yield transforming function. The generator is resumed with the result of invoking it with the yielded value.

