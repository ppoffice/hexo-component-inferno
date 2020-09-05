/**
 * Twitter conversion tracking plugin JSX component.
 * @module view/plugin/twitter_conversion_tracking
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

/**
 * Twitter conversion tracking plugin JSX component.
 *
 * @see https://business.twitter.com/en/help/campaign-measurement-and-analytics/conversion-tracking-for-websites.html
 * @example
 * <TwiterCT pixelId="******" />
 */
class TwiterCT extends Component {
  render() {
    const { pixelId } = this.props;

    const js = `
    !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
    },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='//static.ads-twitter.com/uwt.js',
    a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
    twq('init', ${JSON.stringify(pixelId)});
    twq('track', 'PageView');
    `;

    return <script dangerouslySetInnerHTML={{ __html: js }}></script>;
  }
}

/**
 * Cacheable Twitter conversion tracking plugin JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <TwiterCT.Cacheable
 *     head={false}
 *     plugin={{ pixel_id: '******' }} />
 */
TwiterCT.Cacheable = cacheComponent(TwiterCT, 'plugin.twitterconversiontracking', (props) => {
  const { head, plugin } = props;
  if (head || !plugin.pixel_id) {
    return null;
  }
  return {
    pixelId: plugin.pixel_id,
  };
});

module.exports = TwiterCT;
