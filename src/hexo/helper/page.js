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
 * 
 * // Use the function below to test if the given content is include html tag,
 * // html tag will bd removed.
 * remove_html_tag(htmlContent);
 */
module.exports = function(hexo) {
    hexo.extend.helper.register('is_categories', function(page = null) {
        return (page === null ? this.page : page).__categories === true;
    });

    hexo.extend.helper.register('is_tags', function(page = null) {
        return (page === null ? this.page : page).__tags === true;
    });

    hexo.extend.helper.register('remove_html_tag', function (htmlContent = null) {
        return htmlContent == undefined || htmlContent === null ? null : htmlContent.replace(/<\/?.+?>/g,"");
    });
};
