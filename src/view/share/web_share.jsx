/**
 * Native Web Share button JSX component.
 * @module view/share/web_share
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');

// Brand colors only: the consuming theme owns button geometry and interaction.
const NETWORKS = [
  { id: 'x', name: 'X', background: '#000000', foreground: '#ffffff' },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'fab fa-facebook-f',
    background: '#0866ff',
    foreground: '#ffffff',
  },
  {
    id: 'weibo',
    name: 'Weibo',
    icon: 'fab fa-weibo',
    background: '#e6162d',
    foreground: '#ffffff',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: 'fab fa-telegram-plane',
    background: '#26a5e4',
    foreground: '#ffffff',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'fab fa-linkedin-in',
    background: '#0a66c2',
    foreground: '#ffffff',
  },
];

function shareUrl(network, url, title) {
  const link = encodeURIComponent(url);
  const text = encodeURIComponent(title);
  return {
    x: 'https://twitter.com/intent/tweet?url=' + link + '&text=' + text,
    facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + link,
    weibo: 'https://service.weibo.com/share/share.php?url=' + link + '&title=' + text,
    telegram: 'https://t.me/share/url?url=' + link + '&text=' + text,
    linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + link,
  }[network];
}

/**
 * Native Web Share button JSX component.
 *
 * @example
 * <WebShare />
 */
class WebShare extends Component {
  render() {
    const { label = 'More', url, title } = this.props;
    const js = `(function () {
      ${shareUrl.toString()}
      document.querySelectorAll('.hexo-component-share').forEach(function (container) {
        var button = container.querySelector('button');
        var status = container.querySelector('[role="status"]');
        var native = container.querySelector('[data-share-native]');
        var data = { title: container.dataset.title || document.title, url: container.dataset.url || window.location.href };
        container.querySelectorAll('[data-share-network]').forEach(function (link) {
          link.href = shareUrl(link.dataset.shareNetwork, data.url, data.title);
        });
        button.hidden = false;
        native.hidden = false;
        button.disabled = typeof navigator.share !== 'function';
        status.hidden = !button.disabled;
        button.onclick = async function () {
          status.hidden = true;
          try {
            await navigator.share({ title: container.dataset.title || document.title, url: container.dataset.url || window.location.href });
          } catch (error) {
            if (error && error.name === 'AbortError') return;
            status.hidden = false;
          }
        };
      });
    })();`;
    return (
      <>
        <div
          class="hexo-component-share"
          data-share-provider="web_share"
          data-url={url}
          data-title={title}>
          <div class="buttons is-centered">
            {NETWORKS.map((network) => (
              <a
                key={network.id}
                class="button"
                style={`background-color:${network.background};border-color:${network.background};color:${network.foreground}`}
                data-share-network={network.id}
                href={shareUrl(network.id, url || '', title || '')}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Share on ${network.name}`}>
                <span class="icon" aria-hidden="true">
                  {network.icon ? (
                    <i class={network.icon}></i>
                  ) : (
                    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.4l7.9-9L.8 2h6.5l4.5 6.7L18.9 2Zm-1.1 18h1.7L6.4 3.9H4.6L17.8 20Z" />
                    </svg>
                  )}
                </span>
                <span>{network.name}</span>
              </a>
            ))}
            <span data-share-native="" class="has-text-centered" hidden={true}>
              <button type="button" class="button" hidden={true}>
                <span class="icon" aria-hidden="true">
                  <i class="fas fa-share-alt"></i>
                </span>
                <span>{label}</span>
              </button>
            </span>
          </div>
          <p role="status" hidden={true}>
            System sharing is unavailable in this browser. You can use the platform buttons above.
          </p>
        </div>
        <script dangerouslySetInnerHTML={{ __html: js }}></script>
      </>
    );
  }
}

/**
 * Cacheable Web Share button JSX component.
 * <p>
 * This class is supposed to be used in combination with the <code>locals</code> hexo filter
 * ({@link module:hexo/filter/locals}).
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <WebShare.Cacheable />
 */
WebShare.Cacheable = cacheComponent(WebShare, 'share.web_share', ({ config = {}, page = {} }) => {
  const language = page.lang || page.language || config.language || 'en';
  return {
    label: /^zh(?:-|$)/i.test([].concat(language)[0]) ? '更多' : 'More',
    url: page.permalink,
    title: page.title,
  };
});

module.exports = WebShare;
