const path = require('path');
const fs = require('fs');
const url = require('url');
const promiseSpawn = require('./promise-spawn.js');

const getSettings = (cwd) => {
  const defaults = {
    updatePackageLock: true,
    apiUrl: null,
    whitelist: [],
    blacklist: [],
    commitMessage: 'chore(package): Update ${name} to ${version}',
    prTitle: 'Brightkeeper: Update ${name} to ${version}',
    prBody: '',
    singleCommitMessage: 'chore(package): Update all packages with brightkeeper',
    singlePrTitle: 'Brightkeeper: Update all packages',
    singlePrBody: '',
    baseBranch: 'master',
    singlePullRequest: null,
    readmeBadge: true
  };

  /* check if package-lock is enabled for this package */
  return promiseSpawn('npm', ['config', 'get', 'package-lock'], {cwd, rejectFailure: true}).then(function(result) {
    if (result.stdout.toString() === 'false') {
      defaults.updatePackageLock = false;
    }

    return promiseSpawn('git', ['ls-remote', '--get-url', 'origin'], {cwd, rejectFailure: true});
  /* Get the remote origin url */
  }).then(function(result) {
    const originUrl = url.parse(result.stdout.toString().trim());

    // set github enterprise api url
    if (originUrl.host !== 'github.com') {
      defaults.apiUrl = originUrl.protocol + '//' + originUrl.hostname + '/api/v3';
    }

    const urlParts = originUrl.path.replace(/^\//, '').split('/');

    /* Get the user/repo from that url */

    // get settings from config
    let settings = {};

    if (fs.existsSync(path.join(cwd, 'brightkeeper.json'))) {
      settings = JSON.parse(fs.readFileSync(path.join(cwd, 'brightkeeper.json')));
    } else {
      settings = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'))).brightkeeper || {};
    }

    settings = Object.assign(defaults, settings);

    settings.user = urlParts[0];
    settings.repo = urlParts[1];

    settings.auth = {};

    if (process.env.GITHUB_TOKEN) {
      settings.auth.token = process.env.GITHUB_TOKEN;
    }

    if (process.env.GITHUB_USERNAME) {
      settings.auth.username = process.env.GITHUB_USERNAME;
    }

    if (process.env.GITHUB_PASSWORD) {
      settings.auth.password = process.env.GITHUB_PASSWORD;
    }

    return settings;

  });
};

module.exports = getSettings;
