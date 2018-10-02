/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');
const createPullRequest = require('./create-pull-request.js');
const shell = require('shelljs');

const depTypes = [
  'peerDependencies',
  'bundledDependencies',
  'optionalDependencies',
  'devDependencies',
  'dependencies'
];

const badge = '[![Brightkeeper badge](https://img.shields.io/badge/brightkeeper-enabled-brightgreen.svg)](https://github.com/brandonocasey/brightkeeper)';

const replace = function(str, replacements) {
  let newstr = str;

  Object.keys(replacements).forEach((k) => {
    const v = replacements[k];

    newstr = newstr.replace('${' + k + '}', v);
  });

  return newstr;
};

const getReadme = function(cwd) {
  const readme = shell.ls(path.join(cwd, '*.md')).filter((f) => (/README.md$/i).test(f));

  if (readme.length) {
    return readme[0];
  }
};

const singlePullRequest = function(cwd, settings, newVersions) {
  const files = {};

  /* add badge to README for first pr */
  if (settings.firstPullRequest) {
    const readme = getReadme(cwd);
    const contents = badge + '\n' + fs.readFileSync(readme);

    files[path.basename(readme)] = contents;
    process.exit();
  }

  /* We are in singlePullRequest mode unless singlePullRequest is explicitly false */
  const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json')));

  /* update newVersions */
  Object.keys(newVersions).forEach(function(name) {
    const version = newVersions[name];

    depTypes.forEach(function(type) {
      if (pkg[type] && pkg[type][name]) {
        pkg[type][name] = version;
      }
    });
  });

  const gitSettings = {
    prTitle: settings.singlePrTitle,
    prBody: settings.singlePrBody,
    commitMessage: settings.singleCommitMessage,
    headBranch: 'brightkeeper/update-all',
    baseBranch: settings.baseBranch
  };

  files['package.json'] = JSON.stringify(pkg, null, 2) + '\n';

  return createPullRequest(cwd, settings, gitSettings, files, 'update-all').then(function() {
    return Promise.resolve([gitSettings.prTitle]);
  });
};

const individualPullRequest = function(cwd, settings, newVersions) {
  const promises = [];
  const prs = [];

  Object.keys(newVersions).forEach(function(name) {
    const version = newVersions[name];
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json')));

    depTypes.forEach(function(type) {
      if (pkg[type] && pkg[type][name]) {
        pkg[type][name] = version;
      }
    });

    const gitSettings = {
      prTitle: replace(settings.prTitle, {name, version}),
      prBody: replace(settings.prBody, {name, version}),
      commitMessage: replace(settings.commitMessage, {name, version}),
      headBranch: `brightkeeper/${name}`.replace(/[\^|~]/g, ''),
      baseBranch: settings.baseBranch
    };

    prs.push(gitSettings.prTitle);

    promises.push(createPullRequest(cwd, settings, gitSettings, {'package.json': pkg}), `${name}@${version}`);
  });

  return Promise.all(promises).then(function() {
    return Promise.resolve(prs);
  });
};

const createPullRequests = function(cwd, settings, newVersions) {
  // if there is nothing to update, do nothing
  if (Object.keys(newVersions).length === 0) {
    return Promise.resolve([]);
  }
  const readme = getReadme(cwd);

  if (settings.readmeBadge && readme) {
    const contents = shell.cat(readme);

    if (contents.toLowerCase().indexOf(badge.toLowerCase()) === -1) {
      settings.firstPullRequest = true;
    }
  }

  if (settings.firstPullRequest && settings.singlePullRequest !== false) {
    return singlePullRequest(cwd, settings, newVersions);
  }

  return individualPullRequest(cwd, settings, newVersions);
};

module.exports = createPullRequests;
