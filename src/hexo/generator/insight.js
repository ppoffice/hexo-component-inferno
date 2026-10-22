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
    // content.json holds plain text, which the search script escapes when it shows it
    const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
    function decodeEntities(str) {
      return str.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
        if (entity[0] === '#') {
          const code =
            entity[1] === 'x' || entity[1] === 'X'
              ? parseInt(entity.slice(2), 16)
              : parseInt(entity.slice(1), 10);
          return code <= 0x10ffff ? String.fromCodePoint(code) : match;
        }
        const char = ENTITIES[entity.toLowerCase()];
        return char === undefined ? match : char;
      });
    }
    function plain(str) {
      return decodeEntities(util.stripHTML(str || ''))
        .replace(/\s+/g, ' ')
        .trim();
    }
    function mapPost(post) {
      return {
        title: (post.title || '').trim(),
        text: plain(post.content),
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
