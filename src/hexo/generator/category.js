/**
 * Register the Hexo generator for generating <code>/category/</code> pages.
 * @module hexo/generator/category
 */
const pagination = require('hexo-pagination');

/**
 * Register the Hexo generator for generating <code>/category/</code> pages.
 * <p>
 * An array of parent categories will be attached to the page local
 * variables.
 *
 * @param {Hexo} hexo The Hexo instance.
 */
module.exports = function (hexo) {
  hexo.extend.generator.register('category', function (locals) {
    const config = this.config;
    const paginationDir = config.pagination_dir || 'page';
    // Like hexo-generator-category, use per_page of the site config without a category_generator one
    const generatorConfig = config.category_generator || {};
    let perPage = 10;
    if (typeof generatorConfig.per_page === 'number') {
      perPage = generatorConfig.per_page;
    } else if (typeof config.per_page === 'number') {
      perPage = config.per_page;
    }
    const orderBy =
      (config.category_generator ? config.category_generator.order_by : null) || '-date';

    function findParent(category) {
      let parents = [];
      if (typeof category === 'object' && 'parent' in category) {
        const parent = locals.categories.filter((cat) => cat._id === category.parent).first();
        parents = findParent(parent).concat([parent]);
      }
      return parents;
    }

    return locals.categories.reduce((result, category) => {
      const posts = category.posts.sort(orderBy);
      const data = pagination(category.path, posts, {
        perPage: perPage,
        layout: ['category', 'archive', 'index'],
        format: paginationDir + '/%d/',
        data: {
          category: category.name,
          parents: findParent(category),
        },
      });

      return result.concat(data);
    }, []);
  });
};
