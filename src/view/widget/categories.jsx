/**
 * Categories widget JSX component.
 * @module view/widget/categories
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const { translate } = require('../../util/i18n');
const {
  resolveCategoryOptions,
  resolveCategoryDepth,
  prepareCategories,
} = require('../../util/categories');

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
  const { order, orderBy, showCurrent, showCount } = resolveCategoryOptions(widget);
  const { url_for, _p, __ } = helper;

  if (!categories || !categories.length) {
    return null;
  }

  const depth = resolveCategoryDepth(widget.depth, props.depth);
  const { categories: list, hasMore } = prepareCategories(
    categories,
    { order, orderBy, showCurrent, depth, amount },
    page,
    url_for,
  );

  return {
    showCount,
    categories: list,
    title: _p('common.category', Infinity),
    moreUrl: hasMore ? url_for('categories/') : null,
    moreTitle: translate(__, 'widget.more', 'More'),
  };
});

module.exports = Categories;
