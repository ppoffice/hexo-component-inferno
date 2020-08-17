/**
 * Register the Hexo generator for exporting text-based asset files like JavaScript and CSS.
 * @module hexo/generator/assets
 */

const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist) {
  filelist = filelist || [];
  fs.readdirSync(dir).forEach((file) => {
    // don't include Unix hidden files
    if (file.startsWith('.')) {
      return;
    }
    const fullpath = path.join(dir, file);
    if (fs.statSync(fullpath).isDirectory()) {
      filelist = walkSync(fullpath, filelist);
    } else {
      filelist.push(fullpath);
    }
  });
  return filelist;
}

/**
 * Register the Hexo generator for exporting text-based asset files like JavaScript and CSS.
 * <p>
 * The asset files are under the asset/ folder of this library.
 * If a file of the same path already exists in the theme's source folder, the asset
 * file in this library will not be exported.
 *
 * @param {Hexo} hexo The Hexo instance.
 */
module.exports = function (hexo) {
  hexo.extend.generator.register('static_assets', (locals) => {
    const assetsDir = path.join(__dirname, '../../../asset');
    return walkSync(assetsDir)
      .map((file) => {
        const filepath = path.relative(assetsDir, file);
        if (fs.existsSync(path.join(hexo.theme_dir, 'source', filepath))) {
          return null;
        }
        return {
          path: '/' + filepath.replace(/\\/g, '/'),
          data: fs.readFileSync(file, { encoding: 'utf-8' }),
        };
      })
      .filter((file) => file !== null);
  });
};
