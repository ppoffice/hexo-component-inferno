/**
 * Disqus comment JSX component.
 * @module view/comment/disqus
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const { toJs } = require('../../util/script');

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
            this.page.url = ${toJs(permalink)};
            this.page.identifier = ${toJs(disqusId || path)};
        };
        (function() {
            var d = document, s = d.createElement('script');
            // Disqus parses computed link/background colors with a legacy RGB-only parser.
            // Serialize the current theme colors to sRGB without changing the rest of the page.
            var thread = d.getElementById('disqus_thread');
            var canvas = d.createElement('canvas');
            canvas.width = canvas.height = 1;
            var context = canvas.getContext('2d');
            function rgb(color) {
                context.clearRect(0, 0, 1, 1);
                context.fillStyle = color;
                context.fillRect(0, 0, 1, 1);
                var pixel = context.getImageData(0, 0, 1, 1).data;
                return 'rgba(' + pixel[0] + ',' + pixel[1] + ',' + pixel[2] + ',' + pixel[3] / 255 + ')';
            }
            var link = d.createElement('a');
            link.href = '#';
            thread.appendChild(link);
            var linkColor = rgb(getComputedStyle(link).color);
            thread.removeChild(link);
            var style = d.createElement('style');
            style.textContent = '#disqus_thread a { color: ' + linkColor + '; }';
            thread.parentNode.insertBefore(style, thread);
            for (var node = thread; node; node = node.parentElement) {
                var background = rgb(getComputedStyle(node).backgroundColor);
                if (background !== 'rgba(0,0,0,0)') {
                    thread.style.backgroundColor = background;
                    break;
                }
            }
            s.src = ${toJs(`//${shortname}.disqus.com/embed.js`)};
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
