/* eslint-disable no-console */
const path = require('path');
const cloneToTemp = require('./clone-to-temp.js');
const spawnSync = require('child_process').spawnSync;
const fs = require('fs');
const promiseSpawn = require('./promise-spawn.js');
const mapSeriesPromise = require('./map-series-promise.js');
const getGitConnection = require('./get-git-connection.js');

const createPullRequest = function(dir, settings, gitSettings, files, logName) {
  const {
    baseBranch,
    headBranch,
    commitMessage,
    prTitle,
    prBody
  } = gitSettings;

  let cwd;
  const gitConnection = getGitConnection(settings);

  return cloneToTemp(dir).then(function(tempDir) {
    cwd = tempDir;

    /* delete the current branch if it exists, so we can update it */
    const localResult = spawnSync('git', ['rev-parse', headBranch], {cwd});
    const commands = [];

    if (localResult.status === 0) {
      commands.push(['git', 'branch', '-D', headBranch]);
    }

    const remoteResult = spawnSync('git', ['ls-remote', '--heads', 'origin', headBranch], {cwd});

    if (remoteResult.stdout.toString().trim().length > 0) {
      commands.push(['git', 'checkout', `origin/${headBranch}`]);
    }

    commands.push(['git', 'checkout', '-b', headBranch]);
    commands.push(['npm', 'i', '--no-save', 'npm-merge-driver-install']);

    /* get to the corrcect place to make a commit */
    return mapSeriesPromise(commands, function(args) {
      const bin = args.shift();

      console.log(`Brightkeeper: ${logName}: Running ${bin} ${args.join(' ')}`);

      return promiseSpawn(bin, args, {cwd, rejectFailure: true});
    });

  // attempt to rebase
  }).then(function() {
    console.log(`Brightkeeper: ${logName}: attempting rebase`);
    return promiseSpawn('git', ['rebase', baseBranch], {cwd});
  }).then(function(result) {
    console.log(result);
    if (result.status !== 0) {
      console.log(`Brightkeeper: ${logName}: rebase was unsuccessful`);
      return promiseSpawn('git', ['rebase', '--abort'], {cwd, rejectFailure: true});
    }

    console.log(`Brightkeeper: ${logName}: rebase was successful`);
    return Promise.resolve();
  }).then(function() {
    let commands = [];

    /* write files that have been given to use changed */
    Object.keys(files).forEach(function(fileName) {
      const contents = files[fileName];

      console.log(`Brightkeeper: ${logName}: Writing ${fileName}`);

      fs.writeFileSync(path.join(cwd, fileName), contents);
    });

    if (settings.updatePackageLock) {
      commands.push(['npm', 'i', '--package-lock-only']);
    }

    commands = commands.concat([
      ['git', 'commit', '--no-verify', '-a', '-m', commitMessage],
      ['git', 'push', '--no-verify', '-fu', 'origin', headBranch]
    ]);

    return mapSeriesPromise(commands, function(args) {
      const bin = args.shift();

      console.log(`Brightkeeper: ${logName}: Running ${bin} ${args.join(' ')}`);

      return promiseSpawn(bin, args, {cwd, rejectFailure: true});
    });
  }).then(function() {
    return gitConnection.listPullRequests();
  }).then(function(response) {
    // open a new pr if one does not exist, otherwise it will be update by the git push above
    const branches = response.data.map((pr) => pr.head.ref);

    if (branches.indexOf(headBranch) !== -1) {
      return Promise.resolve();
    }

    const promises = [];

    promises.push(gitConnection.createPullRequest({
      title: prTitle,
      head: headBranch,
      base: baseBranch,
      body: prBody
    }));

    return Promise.all(promises);
  });
};

module.exports = createPullRequest;
