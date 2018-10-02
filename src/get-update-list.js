const ncu = require('npm-check-updates');
const fs = require('fs');
const path = require('path');

/* get dependency updates for a directory */
const getUpdateList = function(dir, settings) {
  // check out the branch they wan  /* read the package.json */
  return fs.readFileAsync(path.join(dir, 'package.json'), 'utf-8').then(function(packageData) {

    // use npm-check-updates to check for updates
    return ncu.run({
      // upgrade all packages even those that match current semver range
      upgradeAll: true,

      // return json of upgraded packages
      upgrade: false,

      filter: settings.whitelist.join(' '),
      reject: settings.blacklist.join(' '),
      packageData
    });
  });
};

module.exports = getUpdateList;
