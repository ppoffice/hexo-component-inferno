/**
 * Register the Hexo filter for merging theme and site config, and add all helper functions to a
 * dedicated property (<code>helper</code>) in the locals.
 * @module hexo/filter/locals
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Register the Hexo filter for merging theme and site config, and add all helper functions to a
 * dedicated property (<code>helper</code>) in the locals.
 * <p>
 * This filter will try to merge
 * <ul>
 * <li>the post/page config defined in the Markdown file's front-matter,</li>
 * <li>post/page config defined in <code>themes/[theme_name]/_config.post.yml</code> or
 * <code>themes/[theme_name]/_config.page.yml</code>,</li>
 * <li>post/page layout config defined in <code>[site_root]/_config.post.yml</code> or
 * <code>[site_root]/_config.page.yml</code>,</li>
 * <li>theme config defined in <code>themes/[theme_name]/_config.yml</code> or
 * <code>node_modules/hexo-theme-[theme_name]/_config.yml</code> if it is installed as an NPM package,
 * </li>
 * <li>and the site config defined in <code>_config.yml</code>,</li>
 * </ul>
 * in the above order (the former config will overwrite later ones).
 * This allow the user to customize the theme for each post/page, as well as for all post or pages.
 * <br>
 * It also adds a new variable named <code>helper</code>, containing all Hexo helper functions, to the page
 * locals so that you can them through it instead.
 * It is useful for passing helper functions to the cacheable view components.
 * <p>
 * <b>NOTE: This filter must be registered before any other Hexo extensions or views in order to take effect.</b>
 *
 * @param {Hexo} hexo The Hexo instance.
 */
module.exports = (hexo) => {
  const RESERVED_KEYS = {
    post: Object.keys(require('hexo/lib/models/post')(hexo).paths),
    page: Object.keys(require('hexo/lib/models/page')(hexo).paths),
  };

  function loadLayoutConfig(layout) {
    let config = {};
    const configInSiteDir = path.join(hexo.base_dir, '_config.' + layout + '.yml');
    const configInThemeDir = path.join(hexo.theme_dir, '_config.' + layout + '.yml');
    [configInSiteDir, configInThemeDir].forEach((configPath) => {
      if (fs.existsSync(configPath)) {
        config = Object.assign(config, yaml.load(fs.readFileSync(configPath)));
      }
    });
    return config;
  }

  const ALTERNATIVE_CONFIG = {
    post: loadLayoutConfig('post'),
    page: loadLayoutConfig('page'),
  };

  function stripConfig(source, reservedKeys) {
    const result = {};
    Object.keys(source)
      .filter(
        (key) =>
          !key.startsWith('_') && !reservedKeys.includes(key) && typeof source[key] !== 'function',
      )
      .forEach((key) => {
        result[key] = source[key];
      });
    return result;
  }

  hexo.extend.filter.register('template_locals', (locals) => {
    // inject helper functions
    locals.helper = {};
    const helpers = hexo.extend.helper.list();
    for (const name in helpers) {
      locals.helper[name] = helpers[name].bind(locals);
    }
    if (typeof locals.__ === 'function') {
      locals.helper.__ = locals.__;
    }
    if (typeof locals._p === 'function') {
      locals.helper._p = locals._p;
    }

    const page = locals.page;
    if (page) {
      locals.config = Object.assign({}, locals.config, locals.theme);
      if (page.layout in ALTERNATIVE_CONFIG) {
        // load alternative config if exists
        locals.config = Object.assign(locals.config, ALTERNATIVE_CONFIG[page.layout]);
      }
      // merge page configs
      if (page.__post === true) {
        Object.assign(locals.config, stripConfig(page, RESERVED_KEYS.post));
      } else if (page.__page === true) {
        Object.assign(locals.config, stripConfig(page, RESERVED_KEYS.page));
      }
    }

    return locals;
  });
};
