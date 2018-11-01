const globby = require('globby');
const path = require('path');

const toInclude = process.env.SITES && process.env.SITES.split(',') || null;

if (toInclude) {
  console.log('Only building the following sites:', toInclude);
}

const siteConfigPaths = globby.sync('sites/**/webpack.config.js');
const configs = [];

for (const configPath of siteConfigPaths) {
  const modulePath = './' + configPath.replace(/\.js$/, '');
  const modulePathParts = path.dirname(modulePath).split('/');
  const siteName = modulePathParts[modulePathParts.length - 1];
  if (!toInclude || ~toInclude.indexOf(siteName)) {
    console.log(siteName, '-> Adding', modulePath, 'to webpack build');
    const config = require(modulePath);
    configs.push(config);
  }
};

module.exports = configs;
