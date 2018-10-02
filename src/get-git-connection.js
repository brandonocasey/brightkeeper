const Github = require('github-api');

const getGitConnection = function({auth, apiUrl, user, repo}) {
  return new Github(auth, apiUrl).getRepo(user, repo);
};

module.exports = getGitConnection;
