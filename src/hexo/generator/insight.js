/**
 * Insight search content.json generator.
 * @module hexo/generator/insight
 */
const util = require('hexo-util');

/**
 * Insight search content.json generator.
 *
 * @param {Hexo} hexo The Hexo instance.
 */
module.exports = function (hexo) {
  hexo.extend.generator.register('insight', function (locals) {
    const url_for = hexo.extend.helper.get('url_for').bind(this);
    function escape(str) {
      return util.escapeHTML(str).trim();
    }
    function minify(str) {
      return util
        .stripHTML(str)
        .trim()
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/&#x([\da-fA-F]+);/g, (match, hex) => {
          return String.fromCharCode(parseInt(hex, 16));
        })
        .replace(/&#([\d]+);/g, (match, dec) => {
          return String.fromCharCode(dec);
        });
    }
    function mapPost(post) {
      return {
        title: escape(post.title),
        text: minify(post.content),
        link: url_for(post.path),
      };
    }
    function mapTag(tag) {
      return {
        name: escape(tag.name),
        slug: minify(tag.slug),
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
