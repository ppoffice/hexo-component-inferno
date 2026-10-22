/**
 * Insight search content.json generator.
 * @module hexo/generator/insight
 */
const { toPlainText } = require('../../util/html');

/**
 * Insight search content.json generator.
 *
 * @param {Hexo} hexo The Hexo instance.
 */
module.exports = function (hexo) {
  hexo.extend.generator.register('insight', function (locals) {
    const url_for = hexo.extend.helper.get('url_for').bind(this);
    // content.json holds plain text, which the search script escapes when it shows it
    function mapPost(post) {
      return {
        title: (post.title || '').trim(),
        text: toPlainText(post.content),
        link: url_for(post.path),
      };
    }
    function mapTag(tag) {
      return {
        name: (tag.name || '').trim(),
        slug: (tag.slug || '').trim(),
        link: url_for(tag.path),
      };
    }
    const site = {
      posts: locals.posts.map(mapPost),
      tags: locals.tags.map(mapTag),
      categories: locals.categories.map(mapTag),
    };
    const index_pages = ((this.theme.config || {}).search || {}).index_pages;
    if (index_pages === false) {
      site.pages = [];
    } else {
      site.pages = locals.pages.map(mapPost);
    }

    return {
      path: '/content.json',
      data: JSON.stringify(site),
    };
  });
};
