/**
 * Register the Hexo generator for generating the <code>/tags/</code> page.
 * @module hexo/generator/tags
 */

/**
 * Register the Hexo generator for generating the <code>/tags/</code> page.
 * <p>
 * A <code>__tags: true</code> property will be attached to the page local
 * variables.
 *
 * @param {Hexo} hexo The Hexo instance.
 */
module.exports = function (hexo) {
  hexo.extend.generator.register('tags', (locals) => {
    return {
      path: 'tags/',
      layout: ['tags'],
      data: Object.assign({}, locals, {
        __tags: true,
      }),
    };
  });
};
