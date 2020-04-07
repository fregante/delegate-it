// TODO: drop file when eslint supports import.meta https://github.com/eslint/eslint/issues/13133
import {createRequire} from 'module';

const require = createRequire(import.meta.url);

export const {JSDOM} = require('jsdom');
