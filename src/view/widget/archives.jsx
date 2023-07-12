/**
 * Archives widget JSX component.
 * @module view/widget/archives
 */
const { Component } = require('inferno');
const { toMomentLocale } = require('hexo/lib/plugins/helper/date');
const { cacheComponent } = require('../../util/cache');

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
    const { items, title, showCount } = this.props;

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
  const { group_by = 'monthly', order = -1, showCount = true, format = null } = widget;

  const { url_for, _p } = helper;
  const posts = site.posts.sort('date', order);
  if (!posts.length) {
    return null;
  }

  const language = toMomentLocale(page.lang || page.language || config.language);

  const data = [];
  let length = 0;

  posts.forEach((post) => {
    // Clone the date object to avoid pollution
    let date = post.date.clone();

    if (config.timezone) {
      date = date.tz(config.timezone);
    }
    if (language) {
      date = date.locale(language);
    }

    const year = date.year();
    const month = date.month() + 1;
    const name = date.format(format || (group_by === 'monthly' ? 'MMMM YYYY' : 'YYYY'));
    const lastData = data[length - 1];

    if (!lastData || lastData.name !== name) {
      length = data.push({
        name,
        year,
        month,
        count: 1,
      });
    } else {
      lastData.count++;
    }
  });

  const link = (item) => {
    let url = `${config.archive_dir}/${item.year}/`;

    if (group_by === 'monthly') {
      if (item.month < 10) url += '0';
      url += `${item.month}/`;
    }

    return url_for(url);
  };

  return {
    items: data.map((item) => ({
      name: item.name,
      count: item.count,
      url: link(item),
    })),
    title: _p('common.archive', Infinity),
    showCount,
  };
});

module.exports = Archives;
