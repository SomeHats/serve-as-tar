const Ignore = require('fstream-ignore');
const path = require('path');
const tar = require('tar');

const app = require('express')();

const argv = require('yargs')
  .usage('$0 [options] ...directories')
  .option('port', {
    alias: 'p',
    describe: 'the port to start the server on',
    type: 'number',
    default: 1337,
  })
  .demand(1, 'must give a folder to serve')
  .argv;

argv._.forEach(name =>
  app.get(`/${name}`, (req, res, next) => {
    res.set('Content-Type', 'application/tar');

    Ignore({ path: path.resolve(name), ignoreFiles: ['.serve-as-tar-ignore'] })
      .on('error', next)
      .pipe(tar.Pack())
      .on('error', next)
      .pipe(res)
      .on('error', next)
  }));

app.listen(argv.port, err => {
  if (err) throw err;
  console.log(`serve-as-tar serving ${argv._.join(', ')} on port ${argv.port}`);
});
