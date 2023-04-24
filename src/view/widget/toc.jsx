/**
 * Table of contents widget JSX component.
 * @module view/widget/toc
 */
const { tocObj: getTocObj, unescapeHTML } = require('hexo-util');
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Export a tree of headings of an article
 * @private
 * @example
 * getToc('HTML content...');
 * // {
 * //    "1": {
 * //        "id": "How-to-enable-table-of-content-for-a-post",
 * //        "text": "How to enable table of content for a post",
 * //        "index": "1"
 * //    },
 * //    "2": {
 * //        "1": {
 * //            "1": {
 * //                "id": "Third-level-title",
 * //                "text": "Third level title",
 * //                "index": "2.1.1"
 * //            },
 * //            "id": "Second-level-title",
 * //            "text": "Second level title",
 * //            "index": "2.1"
 * //        },
 * //        "2": {
 * //            "id": "Another-second-level-title",
 * //            "text": "Another second level title",
 * //            "index": "2.2"
 * //        },
 * //        "id": "First-level-title",
 * //        "text": "First level title",
 * //        "index": "2"
 * //    }
 * // }
 */
function getToc(content, maxDepth) {
  const toc = {};
  const tocObj = getTocObj(content, { min_depth: 1, max_depth: 6 });
  const levels = Array.from(new Set(tocObj.map((item) => item.level)))
    .sort((a, b) => a - b)
    .slice(0, maxDepth);
  const counters = new Array(levels.length).fill(0);

  tocObj.forEach((item) => {
    if (!levels.includes(item.level)) {
      return;
    }

    const { text, id } = item;
    const normalizedLevel = levels.indexOf(item.level);

    for (let i = 0; i < counters.length; i++) {
      if (i > normalizedLevel) {
        counters[i] = 0;
      } else if (i < normalizedLevel) {
        if (counters[i] === 0) {
          // if headings start with a lower level heading, set the former heading index to 1
          // e.g. h3, h2, h1, h2, h3 => 1.1.1, 1.2, 2, 2.1, 2.1.1
          counters[i] = 1;
        }
      } else {
        counters[i] += 1;
      }
    }
    let node = toc;
    for (const i of counters.slice(0, normalizedLevel + 1)) {
      if (!(i in node)) {
        node[i] = {};
      }
      node = node[i];
    }
    node.id = id;
    node.text = text;
    node.index = counters.slice(0, normalizedLevel + 1).join('.');
  });
  return toc;
}

/**
 * Table of contents widget JSX component.
 *
 * @example
 * <Toc
 *     title="Widget title"
 *     content="HTML content"
 *     showIndex={true}
 *     collapsed={true}
 *     maxDepth={3}
 *     jsUrl="******" />
 */
class Toc extends Component {
  renderToc(toc, showIndex = true) {
    let result;

    const keys = Object.keys(toc)
      .filter((key) => !['id', 'index', 'text'].includes(key))
      .map((key) => parseInt(key, 10))
      .sort((a, b) => a - b);

    if (keys.length > 0) {
      result = <ul class="menu-list">{keys.map((i) => this.renderToc(toc[i], showIndex))}</ul>;
    }
    if ('id' in toc && 'index' in toc && 'text' in toc) {
      result = (
        <li>
          <a class="level is-mobile" href={'#' + toc.id}>
            <span class="level-left">
              {showIndex ? <span class="level-item">{toc.index}</span> : null}
              <span class="level-item">{unescapeHTML(toc.text)}</span>
            </span>
          </a>
          {result}
        </li>
      );
    }
    return result;
  }

  render() {
    const { showIndex, maxDepth = 3, collapsed = true } = this.props;
    const toc = getToc(this.props.content, maxDepth);
    if (!Object.keys(toc).length) {
      return null;
    }

    const css =
      '#toc .menu-list > li > a.is-active + .menu-list { display: block; }' +
      '#toc .menu-list > li > a + .menu-list { display: none; }';

    return (
      <div class="card widget" id="toc" data-type="toc">
        <div class="card-content">
          <div class="menu">
            <h3 class="menu-label">{this.props.title}</h3>
            {this.renderToc(toc, showIndex)}
          </div>
        </div>
        {collapsed ? <style dangerouslySetInnerHTML={{ __html: css }}></style> : null}
        <script src={this.props.jsUrl} defer={true}></script>
      </div>
    );
  }
}

/**
 * Cacheable table of contents widget JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Toc.Cacheable
 *     config={{ toc: true }}
 *     page={{ layout: 'post', content: 'HTML content' }}
 *     widget={{ index: true, collapsed: true, depth: 3 }}
 *     helper={{
 *         _p: function() {...},
 *         url_for: function() {...}
 *     }} /> />
 */
Toc.Cacheable = cacheComponent(Toc, 'widget.toc', (props) => {
  const { config, page, widget, helper } = props;
  const { layout, content, encrypt, origin } = page;
  const { index, collapsed = true, depth = 3 } = widget;

  if (config.toc !== true || (layout !== 'page' && layout !== 'post')) {
    return null;
  }

  return {
    title: helper._p('widget.catalogue', Infinity),
    collapsed: collapsed !== false,
    maxDepth: depth | 0,
    showIndex: index !== false,
    content: encrypt ? origin : content,
    jsUrl: helper.url_for('/js/toc.js'),
  };
});

module.exports = Toc;
