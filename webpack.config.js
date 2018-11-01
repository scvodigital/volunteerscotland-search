const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const autoprefixer = require('autoprefixer');
const CompressionPlugin = require('compression-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const sites = [
  { site: 'digitalparticipation', library: 'DigitalParticipation' },
  { site: 'fundingscotland', library: 'FundingScotland' },
  { site: 'getinvolved', library: 'GetInvolved' },
  { site: 'volunteerscotland-search', library: 'VolunteerScotlandSearch' },
  { site: 'goodmoves', library: 'Goodmoves' },
  { site: 'humanrightsdeclaration', library: 'HumanRightsDeclaration' },
  { site: 'scotlandforeurope', library: 'ScotlandForEurope' },
  { site: 'scvo', library: 'SCVO' }
]

function main() {
  let toCompile = [];
  if (process.env.SITES) {
    const names = process.env.SITES.split(',');
    sites.forEach(site => {
      if (names.indexOf(site.name) > -1) {
        toCompile.push(site);
      }
    });
  }
  toCompile = toCompile.length > 0 ? toCompile : sites;
  const noCompression = !!process.env.NO_COMPRESS;

  console.log('Packing sites:', toCompile);

  const plugins = [
    new HardSourceWebpackPlugin()
  ];

  console.log('No Compression:', noCompression);
  if (!noCompression) {

    plugins.push(new UglifyJsPlugin({
      uglifyOptions: {
        ecma: 5,
        sourceMap: true
      }
    }));

    plugins.push(new CompressionPlugin());
    console.log('Added compression plugins ',plugins);
  }

  const modules = toCompile.map(site => {
    const config = getConfig(site.site, site.library, plugins);
    return config;
  });

  return modules;
}

function getConfig(site, library, plugins) {
  const config = {
    entry: ['./sites/' + site + '/main.scss', './sites/' + site + '/main.js'],
    output: {
      filename: 'build/' + site + '/main.js',
      library: library,
      libraryTarget: 'var'
    },
    module: {
      rules: [{
          test: /\.scss$/,
          use: [{
              loader: 'file-loader',
              options: {
                name: 'build/' + site + '/main.css',
              },
            },
            {
              loader: 'extract-loader'
            },
            {
              loader: 'css-loader'
            },
            {
              loader: 'postcss-loader',
              options: {
                plugins: () => [autoprefixer()],
              },
            },
            {
              loader: 'sass-loader',
              options: {
                includePaths: ['./node_modules'],
              },
            }
          ],
        },
        {
          test: require.resolve('jquery'),
          use: [
            {
              loader: 'expose-loader',
              options: 'jQuery'
            },
            {
              loader: 'expose-loader',
              options: '$'
            }
          ]
        },
        {
          test: require.resolve('string'),
          use: [
            {
              loader: 'expose-loader',
              options: 'S'
            }
          ]
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          query: {
            presets: ['es2015'],
          },
        }
      ],
    },
    plugins: plugins
  };

  return config;
}

module.exports = main();
