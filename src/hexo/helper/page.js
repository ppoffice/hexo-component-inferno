/**
 * Register the Hexo helper functions for a Hexo page/post.
 * @module hexo/helper/page
 */

/**
 * Register the Hexo helper functions for a Hexo page/post.
 *
 * @param {Hexo} hexo The Hexo instance.
 * @example
 * // Use the function below to test if the given page is the /categories page
 * // Need to be combined with lib/hexo/generator/categories
 * is_categories(page);
 *
 * // Use the function below to test if the given page is the /tags page
 * // Need to be combined with lib/hexo/generator/tags
 * is_tags(page);
 */
module.exports = function (hexo) {
  hexo.extend.helper.register('is_categories', function (page = null) {
    return (page === null ? this.page : page).__categories === true;
  });

  hexo.extend.helper.register('is_tags', function (page = null) {
    return (page === null ? this.page : page).__tags === true;
  });
};
