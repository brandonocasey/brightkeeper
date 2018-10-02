const shell = require('shelljs');
const TEMP_DIR = require('os').tmpdir();
const crypto = require('crypto');
const path = require('path');

/* clone a directory to temp */
const cloneToTemp = function(dirToClone) {
  return new Promise(function(resolve, reject) {
    const randomString = crypto.randomBytes(20).toString('hex');
    const tempDir = path.join(TEMP_DIR, randomString);

    shell.mkdir(tempDir);

    // get a list of all files to copy, minus node_modules
    const filesToCopy = shell.ls('-A', dirToClone)
      .filter((f) => !(/node_modules/).test(f))
      .map((f) => path.join(dirToClone, f));

    shell.cp('-R', filesToCopy, tempDir);

    const cleanup = () => shell.rm('-rf', tempDir);

    process.on('SIGINT', cleanup);
    process.on('SIGQUIT', cleanup);

    resolve(tempDir);
  });
};

module.exports = cloneToTemp;
