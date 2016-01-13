import jsc from 'jsverify';
import _ from 'ramda';
import is from 'is';
import {isPromise} from '../utils';

export const arbitaryLetter = 
  jsc.oneof( 'abcdefhgijklmnopqrstuvwxyz'.split('').map(c => jsc.constant(c)));

export const arbitaryWord = 
  jsc.nearray( arbitaryLetter )
     .smap(x => x.join(''), x => x.split(''));

export const expectToFail = (promise, descriptor) => {
  if (!isPromise(promise)) { throw `expectToFail: ${JSON.stringify(promise)} is not a Promise`; }

  return promise.then(() => {throw `Expected to fail${ is.defined(descriptor) ? (' on ' + descriptor) : ''}`}, () => true);
}

export const expectToFailWith = (promise, expectedError) => {
  if (!isPromise(promise)) { throw `expectToFailWith: ${JSON.stringify(promise)} is not a Promise`; }

  return promise.then(() => {throw `Expected to fail with ${ expectedError }, instead passed`},
   gotError => {
     if (!_.equals(gotError, expectedError) ){
       throw `Expected to fail with ${ expectedError }, instead got ${gotError}`;
     } else {
       return true;
     }
   });
}

