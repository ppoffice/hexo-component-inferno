/**
 * Categories widget JSX component.
 * @module view/widget/categories
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Categories widget JSX component.
 *
 * @example
 * <Categories
 *     title="Widget title"
 *     showCount={true}
 *     categories={[
 *         {
 *             url: '/path/to/category/page',
 *             name: 'Category name',
 *             count: 1,
 *             isCurrent: false,
 *             children: [{
 *                 url: '/path/to/category/page',
 *                 name: 'Subcategory name',
 *                 count: 1,
 *             }]
 *         }
 *     ]} />
 */
class Categories extends Component {
  renderList(categories, showCount) {
    return categories.map((category) => (
      <li>
        <a class={'level is-mobile' + (category.isCurrent ? ' is-active' : '')} href={category.url}>
          <span class="level-start">
            <span class="level-item">{category.name}</span>
          </span>
          {showCount ? (
            <span class="level-end">
              <span class="level-item tag">{category.count}</span>
            </span>
          ) : null}
        </a>
        {category.children.length ? <ul>{this.renderList(category.children, showCount)}</ul> : null}
      </li>
    ));
  }

  render() {
    const { title, showCount, categories } = this.props;

    return (
      <div class="card widget" data-type="categories">
        <div class="card-content">
          <div class="menu">
            <h3 class="menu-label">{title}</h3>
            <ul class="menu-list">{this.renderList(categories, showCount)}</ul>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Cacheable categories widget JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @see https://github.com/hexojs/hexo/blob/4.2.0/lib/plugins/helper/list_categories.js
 * @example
 * <Categories.Cacheable
 *     site={{ categories: {...} }}
 *     page={{
 *         base: '/path/base/url',
 *         _id: '******'
 *     }}
 *     helper={{
 *         url_for: function() {...},
 *         _p: function() {...}
 *     }}
 *     categories={{...}}
 *     orderBy="name"
 *     order={1}
 *     showCurrent={false}
 *     showCount={true}
 *     depth={3} />
 */
Categories.Cacheable = cacheComponent(Categories, 'widget.categories', (props) => {
  const { page, helper, widget = {} } = props;
  const {
    categories = props.site.categories,
    orderBy = 'name',
    order = 1,
    showCurrent = false,
    showCount = true,
  } = widget;
  const { url_for, _p } = helper;

  if (!categories || !categories.length) {
    return null;
  }

  let depth = 0;
  try {
    depth = parseInt(props.depth, 10);
  } catch (e) {}

  function prepareQuery(parent) {
    const query = {};

    if (parent) {
      query.parent = parent;
    } else {
      query.parent = { $exists: false };
    }

    return categories
      .find(query)
      .sort(orderBy, order)
      .filter((cat) => cat.length);
  }

  function hierarchicalList(level, parent) {
    return prepareQuery(parent).map((cat, i) => {
      let children = [];
      if (!depth || level + 1 < depth) {
        children = hierarchicalList(level + 1, cat._id);
      }

      let isCurrent = false;
      if (showCurrent && page) {
        for (let j = 0; j < cat.length; j++) {
          const post = cat.posts.data[j];
          if (post && post._id === page._id) {
            isCurrent = true;
            break;
          }
        }
        // special case: category page
        isCurrent = isCurrent || (page.base && page.base.startsWith(cat.path));
      }

      return {
        children,
        isCurrent,
        name: cat.name,
        count: cat.length,
        url: url_for(cat.path),
      };
    });
  }

  return {
    showCount,
    categories: hierarchicalList(0),
    title: _p('common.category', Infinity),
  };
});

module.exports = Categories;
