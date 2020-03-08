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
 * This filter will try to merge the post/page config defined in the Markdown file's front-matter,
 * post/page config defined in <code>theme/name/_config.post.yml</code> or <code>theme/name/_config.page.yml</code>,
 * theme config defined in <code>theme/name/_config.yml</code>, and the site config defined in
 * <code>_config.yml</code>, in the above order (the former config will overwrite later ones).
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
module.exports = hexo => {
    const RESERVED_KEYS = {
        post: Object.keys(require('hexo/lib/models/post')(hexo).paths),
        page: Object.keys(require('hexo/lib/models/page')(hexo).paths)
    };

    function getThemeConfig(extension) {
        if (fs.existsSync(path.join(hexo.theme_dir, '_config' + extension + '.yml'))) {
            return yaml.safeLoad(fs.readFileSync(path.join(hexo.theme_dir, '_config' + extension + '.yml')));
        }
        return null;
    }

    const ALTERNATIVE_CONFIG = {
        post: getThemeConfig('.post'),
        page: getThemeConfig('.page')
    };

    function getExtraConfig(source, reservedKeys) {
        const result = {};
        for (const key in source) {
            if (!key.startsWith('_') && !reservedKeys.includes(key) && typeof source[key] !== 'function') {
                result[key] = source[key];
            }
        }
        return result;
    }

    hexo.extend.filter.register('template_locals', locals => {
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
            if (page.layout in ALTERNATIVE_CONFIG) {
                // load alternative config if exists
                locals.config = Object.assign({}, Object.getPrototypeOf(locals).theme || locals.theme, ALTERNATIVE_CONFIG[page.layout]);
            } else {
                // site config already merged into theme config in hexo/lib/hexo/index.js#Hexo.prototype._generateLocals()
                locals.config = Object.assign({}, Object.getPrototypeOf(locals).theme || locals.theme);
            }
            // merge page configs
            if (page.__post === true) {
                Object.assign(locals.config, getExtraConfig(page, RESERVED_KEYS.post));
            } else if (page.__page === true) {
                Object.assign(locals.config, getExtraConfig(page, RESERVED_KEYS.page));
            }
        }

        return locals;
    });
};
