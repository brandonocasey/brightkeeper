# brightkeeper

[![Build Status](https://travis-ci.org/brandonocasey/brightkeeper.svg?branch=master)](https://travis-ci.org/brandonocasey/brightkeeper)
[![Greenkeeper badge](https://badges.greenkeeper.io/brandonocasey/brightkeeper.svg)](https://greenkeeper.io/)

[![NPM](https://nodei.co/npm/brightkeeper.png?downloads=true&downloadRank=true)](https://nodei.co/npm/brightkeeper/)

Keep all of your packages up to date via automated pull requests run at an interval. The first run will update all packages in one pull request and subsequent pull requests will update one package per pull request. Package updates will automatically be rebased on the interval specified in the CI.

Lead Maintainer: Brandon Casey [@brandonocasey](https://github.com/brandonocasey)

Maintenance Status: Stable

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Usage](#usage)
- [How it works](#how-it-works)
- [Environment variables](#environment-variables)
  - [`GITHUB_TOKEN`](#github_token)
  - [`GITHUB_USERNAME`/`GITHUB_PASSWORD`](#github_usernamegithub_password)
- [Options](#options)
  - [`updatePackageLock`](#updatepackagelock)
  - [`piUrl`](#piurl)
  - [`whitelist`](#whitelist)
  - [`blacklist`](#blacklist)
  - [`commitMessage`](#commitmessage)
  - [`prTitle`](#prtitle)
  - [`prBody`](#prbody)
  - [`singleCommitMessage`](#singlecommitmessage)
  - [`singlePrTitle`](#singleprtitle)
  - [`singlePrBody`](#singleprbody)
  - [`singlePullRequest`](#singlepullrequest)
  - [`baseBranch`](#basebranch)
  - [`readmeBadge`](#readmebadge)
- [TODO](#todo)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Usage
1. Set [Environment Variables](#environment-variables) as outlined
2. global install brightkeeper: `npm i -g brightkeeper`
3. run `brightkeeper` in the current working directory of the project you want to create pull requsets for.

## How it works
> Note: <cwd> refers to the current working directory where brightkeeper was run

1. Gets options from `<cwd>/brightkeeper.json` or falls back to options from `<cwd>/package.json` under the `brightkeeper` key
2. Checks what packages need to be updated in `<cwd>/package.json`
3. Starts to update packages and create prs depending on the mode that it is in
  a. If `singlePullRequest` is set to false in the configuration than each version update will get its own pull request
    i. Each version update will update `<cwd>/package.json`
    ii. If `updatePackageLock` is set to true (default, unless npm config) `<cwd>/package-lock.json` will be updated.
  b. If `singlePullRequest` is not set (default), `readmeBadge` is set (default), and there is no badge in `<cwd>/README.md` then:
    i. `<cwd>/package.json` will be updated will all package versions.
    ii. `<cwd>/README.md` will have badge added.
    iii. If `updatePackageLock` is set to true (default, depends npm config) `<cwd>/package-lock.json` will be updated.
  c. If `singlePullRequest` is set to true then:
    i. `<cwd>/package.json` will be updated will all package versions.
    ii. If `updatePackageLock` is set to true (default, depends npm config) `<cwd>/package-lock.json` will be updated
4. If Brightkeeper runs sees that a pull request needs to be rebased, it will attempt to do so. If it is unable the branch will be recreated from master, the version will be re-updated, and the `origin` branch will be force pushed to.
5. Finally Brightkeeper will look for branches that match the format `brightkeeper/*` that have no pull request associated with them. These branches will be deleted.

## Environment variables
You must provide `GITHUB_TOKEN` or `GITHUB_USER`/`GITHUB_PASS` in the enviorment where brightkeeper will run.

These should all be encrypted with your CI system. For instance [travis does it like this](https://docs.travis-ci.com/user/environment-variables/#defining-encrypted-variables-in-travisyml)

### `GITHUB_TOKEN`
See [the guide](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/) for instructions. Must be provided with `repo` permissions.

### `GITHUB_USERNAME`/`GITHUB_PASSWORD`
The username and password for the github account that should make these pull requests.

## Options
Options, other than git authentication, are provided in `package.json` under the `brightkeeper` key or in a `brightkeeper.json` file in the project root. `brightkeeper.json` will take presidence over `package.json` configuration.

### `updatePackageLock`

> Type: `boolean`
> Default: `true`

For projects that have package-lock off in npm configuration (such as `.npmrc`) package lock updating will default to false, all others will default to true. Providing this option will override any default behaviour.

### `piUrl`

> Type: `string`
> Default: `github or github enterprise api url`

The url to the API for github or github enterprise. By default we look at the origin url. If the host for the origin url is `github.com` we use the default provided by [github-api](https://www.npmjs.com/package/github-api). Otherwise we attempt to use the enerprise version of github by using the protocol and hostname of the origin url and appending `/api/v3` which should point to the enterprise github api.

### `whitelist`

> Type: `Array`
> Default: `[]`

Only manage updates for these packages, by default all packages are managed.

### `blacklist`

> Type: `Array`
> Default: `[]`

Do not attempt to update these packages, by default no packages are blacklisted.

### `commitMessage`

> Type: `string`
> Default: `'chore(package): Update ${name} to ${version}'`

Format for individual package update commit messages. `${name}` will be replaced with the full package name and `${version}` will be replaced with the new version. There are no other replacements at this time.

### `prTitle`

> Type: `string`
> Default: `'Brightkeeper: Update ${name} to ${version}'`

Format for individual package update pull request titles. `${name}` will be replaced with the full package name and `${version}` will be replaced with the new version. There are no other replacements at this time.

### `prBody`

> Type: `string`
> Default: `''`

Format for individual package update pull request descriptions, defaults to empty string. `${name}` will be replaced with the full package name and `${version}` will be replaced with the new version. There are no other replacements at this time.

### `singleCommitMessage`

> Type: `string`
> Default: `'chore(package): Update all packages with brightkeeper'`

Format for singlePullRequset mode package update commit messages. Nothing is replaced for this

### `singlePrTitle`

> Type: `string`
> Default: `'Brightkeeper: Update all packages'`

Format for singlePullRequset mode package update pull request titles. Nothing is replaced for this.

### `singlePrBody`

> Type: `string`
> Default: `''`

Format for singlePullRequset mode package update pull request descriptions. Defaults to empty string. Nothing is replaced for this.

### `singlePullRequest`

> Type: `boolean`
> Default: ``

* When true brightkeeper will open a single pull request for all version updates.
* When false brightkeeper will open one pull request per version update.
* When unset brightkeeper will open a single pull request for all version updates and in that same pull request set `singlePullRequest` to `false`

### `baseBranch`

> Type: `boolean`
> Default: `master`

The branch to make pull requests against. This should also be the branch that Brightkeeper should be run in!

### `readmeBadge`

> Type: `boolean`
> Default: `true`

If this is set to true brightkeeper will check your projects README for a badge. If one does not exist it will run in `singlePullRequest` mode, and the pr that is created will add a badge to the README. Once there is a badge in the README it will run in `individual` pull request mode. If `singlePullRequest` is explicitly set to false this option will be ignored.

## TODO
* Group monorepo updates
  1. find all package.json files
  2. group them all together, + have a way to keep them separate via config
  3. have newVersions look at all package.json files
  4. Have createPullRequests update all package.json files
* is there a better way to rebase when package.json has changed?
* unit tests
