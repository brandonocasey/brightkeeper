const childProcess = require('child_process');

const promiseSpawn = function(bin, args, options = {}) {
  process.setMaxListeners(1000);

  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(bin, args, options);

    let stdout = '';
    let stderr = '';
    let out = '';

    child.stdout.on('data', function(chunk) {
      stdout += chunk;
      out += chunk;
    });

    child.stderr.on('data', function(chunk) {
      stderr += chunk;
      out += chunk;
    });

    const kill = () => child.kill();

    process.on('SIGINT', kill);
    process.on('SIGQUIT', kill);
    process.on('exit', kill);

    child.on('close', function(status) {

      if (options.rejectFailure && status !== 0) {
        return reject(`Command ${bin} ${args.join(' ')} failed code ${status} and with output\n${out.toString()}`);
      }

      return resolve({status, out, stderr, stdout});
    });
  });
};

module.exports = promiseSpawn;
