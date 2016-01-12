import jsc from 'jsverify';
import _ from 'ramda';

export const arbitaryLetter = 
  jsc.oneof( 'abcdefhgijklmnopqrstuvwxyz'.split('').map(c => jsc.constant(c)));

export const arbitaryWord = 
  jsc.nearray( arbitaryLetter )
     .smap(x => x.join(''), x => x.split(''));

export const expectToFail = (promise, descriptor) =>
  promise.then(() => {throw `Expected to fail${ descriptor ? (' on ' + descriptor) : ''}`}, () => true);

export const expectToFailWith = (promise, expectedError) =>
  promise.then(() => {throw `Expected to fail with "${ expectedError }", instead passed`},
   gotError => {
     if (!_.equals(gotError, expectedError) ){
       throw `Expected to fail with "${ expectedError }", instead got
             "${gotError}"`
     } else {
       return true;
     }
   });


export const SAMPLE_MOD_COMMAND_PARAMS = {
  name: 'name'
};

export const SAMPLE_MOD_COMMAND = {
  title: 'Test mod command',
  type: 'mod',
  params: [ 'name' ],
  getFilePath: () => 'mod.js',

  transform: ast => {
    return ast;
  },

  test: {
    params: { name: 'ID' },
    filePath: 'mod.js',
    from: 
      `export const SIGNIN = 'SIGNIN';`,
    to: 
      `export const SIGNIN = 'SIGNIN';`
  }
};

export const SAMPLE_ADD_COMMAND_PARAMS = {
  name: 'name',
  filename: './test/constants.js'
};

export const SAMPLE_ADD_COMMAND = {
  title: 'Test add command',
  type: 'add',
  params: [ 'name', 'filename' ],
  getFilePath: params => params.filename,

  template: ({name}) => `export const ${name} = '${name}';`,

  test: {
    params: {
      name: 'a',
      filename: './src/test/constants.js'
    },
    filePath: './src/test/constants.js',
    output: `export const a = 'a';`
  }
};

