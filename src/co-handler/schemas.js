import yup from 'yup';
import Promise from 'bluebird';
import {isPromise} from '../utils';
import {values} from 'ramda';

export const PROMISE_SCHEMA = yup.mixed().test('is a Promise', isPromise);

export const PROMISES_ARRAY_SCHEMA = yup.array().required().of(PROMISE_SCHEMA);
export const isPromisesArray = x => PROMISES_ARRAY_SCHEMA.validate(x, {strict: true});

export const isPromisesObject = obj => {
  return Promise.all(values(obj).map(PROMISE_SCHEMA.validate));
}
