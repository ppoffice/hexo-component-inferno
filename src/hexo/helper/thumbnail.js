/**
 * Register the Hexo helper functions for testing and extracting thumbnail image path from
 * a post/page.
 * @module hexo/helper/thumbnail
 */

/**
 * Register the Hexo helper functions for testing and extracting thumbnail image path from
 * a post/page.
 *
 * @param {Hexo} hexo The Hexo instance.
 * @example
 * // Use the function below to test if the given post/page has a thumbnail image.
 * has_thumbnail(post);
 *
 * // Use the function below to get the thumbnail image path of a post/page.
 * // If the post/page does not have a thumbnail, the default image (/img/thumbnail.svg)
 * // path will be returned.
 * get_thumbnail(post);
 */
module.exports = function(hexo) {
    hexo.extend.helper.register('has_thumbnail', function(post) {
        const { article } = this.config;
        if (typeof post !== 'object') {
            return false;
        }
        if (article && article.thumbnail === false) {
            return false;
        }
        if ('thumbnail' in post && post.thumbnail) {
            return true;
        }
        return false;
    });

    hexo.extend.helper.register('get_thumbnail', function(post) {
        const url_for = hexo.extend.helper.get('url_for').bind(hexo);
        const has_thumbnail = hexo.extend.helper.get('has_thumbnail').bind(hexo);
        return url_for(has_thumbnail.call(this, post) ? post.thumbnail : '/img/thumbnail.svg');
    });
};
