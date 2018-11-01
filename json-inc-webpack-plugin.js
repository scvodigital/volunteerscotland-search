const fs = require('fs');
const globby = require('globby');
const path = require('path');
const util = require('util');
const { JsonInc } = require('@scvo/json-inc');

function JsonIncWebpackPlugin(options = {}) {
  const apply = async (compiler) => {
    const jsonInc = new JsonInc({});
    const output = options.output;
    const files = globby.sync(options.pattern);
    for (const file of files) {
      try {
        const cwd = path.dirname(file);
        const filename = path.basename(file).replace('.inc.json', '.json');

        compiler.plugin('emit', async (compilation, callback) => {
					const contents = fs.readFileSync(file).toString();
					console.log('Transpiling:', file);
					const json = await jsonInc.transpile(contents, cwd);
					const outputPath = path.join(output, filename);
          compilation.assets[outputPath] = {
            source: function() {
							console.log('Emitting source:', outputPath, json.length);
              return Buffer.from(json);
            },
            size: function() {
              return Buffer.from(json).length;
            }
          };

          callback();
        });
      } catch(err) {
        console.error('Failed to build JSON.inc file', file, err);
      }
    }
  }

  return {
    apply
  };
}

JsonIncWebpackPlugin['default'] = JsonIncWebpackPlugin;
module.exports = JsonIncWebpackPlugin;