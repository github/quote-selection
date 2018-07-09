/* @flow */

import babel from 'rollup-plugin-babel'

const pkg = require('./package.json')

export default {
  input: 'quote-selection.js',
  output: [
    {
      file: pkg['module'],
      format: 'es'
    },
    {
      file: pkg['main'],
      format: 'umd',
      name: 'quoteSelection'
    }
  ],
  plugins: [
    babel({
      presets: ['es2015-rollup', 'flow']
    })
  ]
}
