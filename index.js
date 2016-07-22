#!/usr/bin/env node
const fstreamIgnore = require('fstream-ignore');
const path = require('path');
const stream = require('stream');
const tar = require('tar');
const zlib = require('zlib');

const app = require('express')();

const argv = require('yargs')
  .usage('$0 [options] ...directories')
  .option('port', {
    alias: 'p',
    describe: 'the port to start the server on',
    type: 'number',
    default: 1337,
  })
  .option('host', {
    alias: 'h',
    describe: 'the host to listen on',
    type: 'string',
    default: '0.0.0.0',
  })
  .demand(1, 'must give a folder to serve')
  .argv;

const handleErrors = (stream, onError) =>
  stream.on('error', onError);

const pipeStep = onError => (stream, step) =>
  handleErrors(stream.pipe(step), onError);

const fileStream = name =>
  fstreamIgnore({
    path: path.resolve(name),
    ignoreFiles: ['.serve-as-tar-ignore'],
  });

const serveFile = (name, steps, onError) =>
  steps.reduce(pipeStep(onError), handleErrors(fileStream(name), onError));

argv._.forEach(name => {
  app.get(`/${name}(.tar)?`, (req, res, next) => {
    res.set('Content-Type', 'application/tar');
    serveFile(name, [tar.Pack(), res], next);
  });

  app.get(`/${name}.tar.gz`, (req, res, next) => {
    res.set('Content-Type', 'application/tar+gzip');
    serveFile(name, [tar.Pack(), zlib.createGzip(), res], next);
  });
});

const url = (name, ext = '') => `http://${argv.host}:${argv.port}/${name}${ext}`;

app.listen(argv.port, argv.host, err => {
  if (err) throw err;
  console.log(`serve-as-tar listening`);
  console.log(
    argv._
      .map(name => [url(name), url(name, '.tar'), url(name, '.tar.gz')].join('\n'))
      .join('\n'));
});
