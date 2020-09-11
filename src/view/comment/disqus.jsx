/**
 * Disqus comment JSX component.
 * @module view/comment/disqus
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Disqus comment JSX component.
 *
 * @see https://disqus.com/admin/install/platforms/universalcode/
 * @example
 * <Disqus
 *     shortname="******"
 *     disqusId="******"
 *     permalink="/page/permanent/path"
 *     path="/path/to/page" />
 */
class Disqus extends Component {
  render() {
    const { shortname, disqusId, path, permalink } = this.props;
    if (!shortname) {
      return (
        <div class="notification is-danger">
          You forgot to set the <code>shortname</code> for Disqus. Please set it in{' '}
          <code>_config.yml</code>.
        </div>
      );
    }
    const js = `var disqus_config = function () {
            this.page.url = '${permalink}';
            this.page.identifier = '${disqusId || path}';
        };
        (function() {
            var d = document, s = d.createElement('script');  
            s.src = '//' + '${shortname}' + '.disqus.com/embed.js';
            s.setAttribute('data-timestamp', +new Date());
            (d.head || d.body).appendChild(s);
        })();`;
    return (
      <>
        <div id="disqus_thread">
          <noscript>
            Please enable JavaScript to view the{' '}
            <a href="//disqus.com/?ref_noscript">comments powered by Disqus.</a>
          </noscript>
        </div>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </>
    );
  }
}

/**
 * Cacheable Disqus comment JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Disqus.Cacheable
 *     comment={{ shortname: '*******' }}
 *     page={{
 *         path: '/path/to/page',
 *         disqusId: '******',
 *         permalink: '/page/permanent/link'
 *     }} />
 */
Disqus.Cacheable = cacheComponent(Disqus, 'comment.disqus', (props) => {
  const { comment, page } = props;

  return {
    path: page.path,
    shortname: comment.shortname,
    disqusId: page.disqusId,
    permalink: page.permalink,
  };
});

module.exports = Disqus;
