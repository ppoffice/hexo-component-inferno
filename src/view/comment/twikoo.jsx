/**
 * Twikoo comment JSX component.
 * @module view/comment/twikoo
 */
const { Component, Fragment } = require('inferno');
const { cacheComponent } = require('hexo-component-inferno/lib/util/cache');

/**
 * Twikoo comment JSX component.
 *
 * @see https://twikoo.js.org/quick-start.html
 * @example
 * <Twikoo
 *     env_id="Vercel Domain"
 *     jsUrl="/path/to/Twikoo.js" />
 */
class Twikoo extends Component {
  render() {
    const {
      env_id,
      jsUrl,
    } = this.props;
    const js = `Twikoo.init({
            env_id: '${env_id}'
        });`;
    return (
      <Fragment>
        <div id="twikoo" class="content twikoo"></div>
        <script src={jsUrl}></script>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </Fragment>
    );
  }
}

/**
 * Cacheable Twikoo comment JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Twikoo.Cacheable
 *     comment={{
 *         env_id: "https://path/to/vercel/domain"
 *     }}
 */
Twikoo.Cacheable = cacheComponent(Twikoo, 'comment.twikoo', (props) => {
  const { comment } = props;
  
  return {
    env_id: comment.env_id,
    jsUrl: 'https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-M/twikoo/1.4.18/twikoo.all.min.js',
  };
});

module.exports = Twikoo;
