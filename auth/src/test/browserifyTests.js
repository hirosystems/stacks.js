import run from 'tape-run'
import browserify from 'browserify'

browserify('./lib/test/unitTests.js')
  .bundle()
  .pipe(run())
  .on('results', console.log)
  .pipe(process.stdout)