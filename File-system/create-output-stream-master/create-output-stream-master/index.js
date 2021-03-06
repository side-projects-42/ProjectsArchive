var path = require('path');
var _fs = require('fs');
var mkdir = require('mkdirp');

function createOutputStream(file, options) {
  var dirExists = false;
  var dir = path.dirname(file);

  options = options || {};
  var fs = options.fs || _fs;
  var WriteStream = fs.WriteStream;

  // if fd is set with an actual number, file is created, hence directory is too
  if (options.fd) {
    return fs.createWriteStream(file, options);
  } else {
    // this hacks the WriteStream constructor from calling open()
    options.fd = -1;
  }

  var ws = new WriteStream(file, options);

  var oldOpen = ws.open;
  ws.open = function () {
    ws.fd = null; // set actual fd
    if (dirExists) return oldOpen.call(ws);

    // this only runs once on first write
    mkdir(dir, function (err) {
      if (err) {
        ws.destroy();
        ws.emit('error', err);
        return;
      }
      dirExists = true;
      oldOpen.call(ws);
    });
  };

  ws.open();

  return ws;
}

module.exports = createOutputStream;
