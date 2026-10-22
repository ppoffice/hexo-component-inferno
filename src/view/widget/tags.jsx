/**
 * Tags widget JSX component.
 * @module view/widget/tags
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const { translate } = require('../../util/i18n');

/**
 * Tags widget JSX component.
 *
 * @example
 * <Tags
 *     title="Widget title"
 *     showCount={true}
 *     tags={[
 *         {
 *             url: '/path/to/category/page',
 *             name: 'Category name',
 *             count: 1
 *         }
 *     ]} />
 */
class Tags extends Component {
  render() {
    const { tags, title, showCount, moreUrl, moreTitle } = this.props;

    return (
      <div class="card widget" data-type="tags">
        <div class="card-content">
          <div class="menu">
            <h3 class="menu-label">{title}</h3>
            <div class="field is-grouped is-grouped-multiline">
              {tags.map((tag) => (
                <div class="control">
                  <a class="tags has-addons" href={tag.url}>
                    <span class="tag">{tag.name}</span>
                    {showCount ? <span class="tag">{tag.count}</span> : null}
                  </a>
                </div>
              ))}
              {moreUrl ? (
                <div class="control">
                  <a class="tags has-addons" href={moreUrl}>
                    <span class="tag">
                      <span>{moreTitle}</span>
                      <span class="icon is-small" aria-hidden="true">
                        <i class="fas fa-chevron-right"></i>
                      </span>
                    </span>
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Cacheable tags widget JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @see https://github.com/hexojs/hexo/blob/4.2.0/lib/plugins/helper/list_tags.js
 * @example
 * <Tags.Cacheable
 *     site={{ tags: {...} }}
 *     helper={{
 *         url_for: function() {...},
 *         _p: function() {...}
 *     }}
 *     tags={{...}}
 *     widget={{
 *       order_by: "name",
 *       amount: 100,
 *       show_count: true
 *     }} />
 */
Tags.Cacheable = cacheComponent(Tags, 'widget.tags', (props) => {
  const { helper, widget = {} } = props;
  const { amount } = widget;
  // Options left empty in the config are null, which also take the defaults
  const order_by = widget.order_by || 'name';
  const show_count = widget.show_count !== false;
  let tags = props.tags || props.site.tags;
  const { url_for, _p, __ } = helper;

  if (!tags || !tags.length) {
    return null;
  }

  tags = tags.sort(order_by).filter((tag) => tag.length);
  // Link to the tag page when some of the tags are not shown
  const hasMore = amount > 0 && tags.length > amount;
  if (hasMore) {
    tags = tags.limit(amount);
  }

  return {
    showCount: show_count,
    title: _p('common.tag', Infinity),
    moreUrl: hasMore ? url_for('tags/') : null,
    moreTitle: translate(__, 'widget.more', 'More'),
    tags: tags.map((tag) => ({
      name: tag.name,
      count: tag.length,
      url: url_for(tag.path),
    })),
  };
});

module.exports = Tags;
