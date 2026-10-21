/**
 * Paginator JSX component.
 * @module view/misc/paginator
 */
const { Component } = require('inferno');

/**
 * Paginator JSX component.
 *
 * @name Paginator
 * @example
 * <Paginator
 *     current={1}
 *     total={10}
 *     baseUrl="/page/base/url"
 *     path="/config/pagination/dir"
 *     urlFor={ function () {...} }
 *     prevTitle="Prev"
 *     nextTitle="Next" />
 */
module.exports = class extends Component {
  render() {
    const { current, total, baseUrl, path, urlFor, prevTitle, nextTitle } = this.props;

    function getPageUrl(i) {
      return urlFor(i === 1 ? baseUrl : baseUrl + path + '/' + i + '/');
    }

    function pagination(c, m) {
      const current = c;
      const last = m;
      const delta = 1;
      const left = current - delta;
      const right = current + delta + 1;
      const range = [];
      const elements = [];
      let l;

      for (let i = 1; i <= last; i++) {
        if (i === 1 || i === last || (i >= left && i < right)) {
          range.push(i);
        }
      }

      for (const i of range) {
        if (l) {
          if (i - l === 2) {
            elements.push(
              <li>
                <a class="pagination-link" href={getPageUrl(l + 1)}>
                  {l + 1}
                </a>
              </li>,
            );
          } else if (i - l !== 1) {
            elements.push(
              <li>
                <span
                  class="pagination-ellipsis"
                  dangerouslySetInnerHTML={{ __html: '&hellip;' }}></span>
              </li>,
            );
          }
        }
        elements.push(
          <li>
            <a class={`pagination-link${c === i ? ' is-current' : ''}`} href={getPageUrl(i)}>
              {i}
            </a>
          </li>,
        );
        l = i;
      }
      return elements;
    }

    const hasPrev = current > 1;
    const hasNext = current < total;

    // The hidden prev/next placeholders keep the layout but must not link to missing pages
    return (
      <nav class="pagination" role="navigation" aria-label="pagination">
        <div class={`pagination-previous${hasPrev ? '' : ' is-invisible is-hidden-mobile'}`}>
          <a href={hasPrev ? getPageUrl(current - 1) : null}>{prevTitle}</a>
        </div>
        <div class={`pagination-next${hasNext ? '' : ' is-invisible is-hidden-mobile'}`}>
          <a href={hasNext ? getPageUrl(current + 1) : null}>{nextTitle}</a>
        </div>
        <ul class="pagination-list is-hidden-mobile">{pagination(current, total)}</ul>
      </nav>
    );
  }
};
