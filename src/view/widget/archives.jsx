/**
 * Archives widget JSX component.
 * @module view/widget/archives
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const { translate } = require('../../util/i18n');
const { resolveArchiveOptions, groupArchives } = require('../../util/archives');

/**
 * Archives widget JSX component.
 *
 * @example
 * <Archives
 *     title="Widget title"
 *     showCount={true}
 *     items={[
 *         {
 *             url: '/path/to/archive/page',
 *             name: 'Archive name',
 *             count: 1
 *         }
 *     ]} />
 */
class Archives extends Component {
  render() {
    const { items, title, showCount, moreUrl, moreTitle } = this.props;

    return (
      <div class="card widget" data-type="archives">
        <div class="card-content">
          <div class="menu">
            <h3 class="menu-label">{title}</h3>
            <ul class="menu-list">
              {items.map((archive) => (
                <li>
                  <a class="level is-mobile" href={archive.url}>
                    <span class="level-start">
                      <span class="level-item">{archive.name}</span>
                    </span>
                    {showCount ? (
                      <span class="level-end">
                        <span class="level-item tag">{archive.count}</span>
                      </span>
                    ) : null}
                  </a>
                </li>
              ))}
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
 * Cacheable archives widget JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @see https://github.com/hexojs/hexo/blob/4.2.0/lib/plugins/helper/list_archives.js
 * @example
 * <Archives.Cacheable
 *     site={{ posts: {...} }}
 *     config={{
 *         language: 'en_US',
 *         timezone: 'UTC',
 *         archive_dir: '/path/to/archive'
 *     }}
 *     page={{
 *         lang: 'en_US',
 *         language: 'en_US'
 *     }}
 *     helper={{
 *         url_for: function() {...},
 *         _p: function() {...}
 *     }}
 *     group_by="monthly"
 *     order={-1}
 *     showCount={true}
 *     format="MMMM YYYY" />
 */
Archives.Cacheable = cacheComponent(Archives, 'widget.archives', (props) => {
  const { site, config, page, helper, widget } = props;
  const { groupBy, order, format, amount, showCount } = resolveArchiveOptions(widget);

  const { url_for, _p, __ } = helper;
  const posts = site.posts.sort('date', order);
  if (!posts.length) {
    return null;
  }

  const { groups, hasMore } = groupArchives(posts, {
    groupBy,
    format,
    amount,
    language: page.lang || page.language || config.language,
    timezone: config.timezone,
  });

  const link = (item) => {
    let url = `${config.archive_dir}/${item.year}/`;

    if (groupBy === 'monthly') {
      if (item.month < 10) url += '0';
      url += `${item.month}/`;
    }

    return url_for(url);
  };

  return {
    items: groups.map((item) => ({
      name: item.name,
      count: item.count,
      url: link(item),
    })),
    title: _p('common.archive', Infinity),
    showCount,
    moreUrl: hasMore ? url_for(`${config.archive_dir}/`) : null,
    moreTitle: translate(__, 'widget.more', 'More'),
  };
});

module.exports = Archives;
