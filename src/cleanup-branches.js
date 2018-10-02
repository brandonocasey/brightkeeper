/* eslint-disable no-console */
const promiseSpawn = require('./promise-spawn.js');
const getGitConnection = require('./get-git-connection.js');

/* cleanup brightkeeper/* branches with no pull request attatched */
const cleanupBranches = function(cwd, settings) {
  const prBranches = [];
  const allBranches = [];

  const promises = [];

  const gitConnection = getGitConnection(settings);

  /* get all branches */
  promises.push(promiseSpawn('git', ['fetch', 'origin'], {cwd, rejectFailure: true}).then(function(result) {
    return promiseSpawn('git', ['ls-remote', '--heads', 'origin', 'brightkeeper/*'], {cwd, rejectFailure: true});
  }).then(function(result) {
    result.stdout.toString().trim().split('\n').forEach(function(line) {
      // don't add empty lines into branches
      if (!line) {
        return;
      }

      allBranches.push(line.replace(/^.*refs\/heads\//, ''));
    });
  }));

  /* get all pull request branches */
  promises.push(gitConnection.listPullRequests().then(function(response) {
    response.data.forEach((pr) => {
      prBranches.push(pr.head.ref);
    });
  }));

  return Promise.all(promises).then(function() {
    // find out which brightkeeper branches have no pull request
    prBranches.forEach(function(prBranch) {
      const index = allBranches.indexOf(prBranch);

      if (index !== -1) {
        allBranches.splice(index, 1);
      }
    });

    if (allBranches.length === 0) {
      return Promise.resolve([]);
    }

    const deletePromises = [];

    allBranches.forEach((branchName) => {
      deletePromises.push(
        promiseSpawn('git', ['push', '--no-verify', '--delete', 'origin', branchName], {cwd, rejectFailure: true})
      );
    });

    return Promise.all(promises).then(function() {
      return Promise.resolve(allBranches);
    });
  });
};

module.exports = cleanupBranches;
