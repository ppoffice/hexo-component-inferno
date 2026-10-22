/**
 * Categories widget JSX component.
 * @module view/widget/categories
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const { translate } = require('../../util/i18n');

/**
 * Get the first value that is set, i.e., neither null nor undefined.
 * @private
 */
function firstSet(...values) {
  return values.find((value) => value !== null && typeof value !== 'undefined');
}

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
    const { title, showCount, categories, moreUrl, moreTitle } = this.props;

    return (
      <div class="card widget" data-type="categories">
        <div class="card-content">
          <div class="menu">
            <h3 class="menu-label">{title}</h3>
            <ul class="menu-list">
              {this.renderList(categories, showCount)}
              {moreUrl ? (
                <li>
                  <a class="level is-mobile" href={moreUrl}>
                    <span class="level-start">
                      <span class="level-item">{moreTitle}</span>
                    </span>
                    <span class="level-end">
                      <span class="level-item icon is-small" aria-hidden="true">
                        <i class="fas fa-chevron-right"></i>
                      </span>
                    </span>
                  </a>
                </li>
              ) : null}
            </ul>
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
  const { categories = props.site.categories, amount } = widget;
  // Options left empty in the config are null, which also take the defaults
  const order = firstSet(widget.order, 1);
  // Snake case, like the tags widget, or camel case, which this widget used to read
  const orderBy = firstSet(widget.order_by, widget.orderBy, 'name');
  const showCurrent = firstSet(widget.show_current, widget.showCurrent, false);
  const showCount = firstSet(widget.show_count, widget.showCount, true);
  const { url_for, _p, __ } = helper;

  if (!categories || !categories.length) {
    return null;
  }

  // 0 or no depth shows all levels
  const depth = parseInt(firstSet(widget.depth, props.depth), 10) || 0;

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

  // Only limit the top-level categories, and link to the category page when some are not shown
  const list = hierarchicalList(0);
  const hasMore = amount > 0 && list.length > amount;

  return {
    showCount,
    categories: hasMore ? list.slice(0, amount) : list,
    title: _p('common.category', Infinity),
    moreUrl: hasMore ? url_for('categories/') : null,
    moreTitle: translate(__, 'widget.more', 'More'),
  };
});

module.exports = Categories;
