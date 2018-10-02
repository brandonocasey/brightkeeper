#! /usr/bin/env node
/* eslint-disable no-console */

const getSettings = require('./get-settings.js');
const getUpdateList = require('./get-update-list.js');
const createPullRequests = require('./create-pull-requests.js');
const cleanupBranches = require('./cleanup-branches.js');
const promiseSpawn = require('./promise-spawn.js');

let settings;

promiseSpawn('git', ['fetch', 'origin'], {cwd: process.cwd(), rejectFailure: true}).then(function() {
  return getSettings(process.cwd());
}).then(function(_settings) {
  settings = _settings;

  // create a clone to delete auth
  const settingsClone = Object.assign({}, settings);

  delete settingsClone.auth;
  console.log('Brightkeeper: Running with settings:\n', settingsClone);

  return getUpdateList(process.cwd(), settings);
}).then(function(newVersions) {
  console.log('Brightkeeper: Going to update the following packages:\n', newVersions);

  return createPullRequests(process.cwd(), settings, newVersions);
}).then(function(pullRequests) {
  console.log('Brightkeeper: Created the following pull requests:\n', pullRequests);

  return cleanupBranches(process.cwd(), settings);
}).then(function(branches) {
  console.log('Brightkeeper: Deleted the following old branches:\n', branches);

  process.exit();
}).catch(function(e) {
  console.error('Brightkeeper: error\n', e);

  process.exit(1);
});
