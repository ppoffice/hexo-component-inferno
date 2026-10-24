/**
 * Author profile widget JSX component.
 * @module view/widget/profile
 */
const { Component } = require('inferno');
const { gravatar: gravatarHelper } = require('hexo-util');
const { cacheComponent } = require('../../util/cache');

/**
 * Render a profile from presentation data, without requiring Hexo or a theme's avatar asset.
 * The avatar and link URLs are already resolved. Omit avatar to render no image or placeholder.
 *
 * @example
 * <Profile
 *     avatar="/author.png"
 *     avatarRounded={true}
 *     author="Author"
 *     authorTitle="Writer"
 *     location="London"
 *     counter={{
 *         post: { title: 'Posts', count: 3, url: '/archives/' },
 *         category: { title: 'Categories', count: 1, url: '/categories/' },
 *         tag: { title: 'Tags', count: 2, url: '/tags/' }
 *     }}
 *     followLink="https://example.com/author"
 *     followTitle="Follow"
 *     socialLinks={[{ name: 'GitHub', url: 'https://github.com/author', icon: 'fab fa-github' }]} />
 */
class Profile extends Component {
  renderSocialLinks(links) {
    if (!links.length) return null;
    return (
      <div class="level is-mobile is-multiline">
        {links
          .filter((link) => typeof link === 'object')
          .map((link) => (
            <a
              class="level-item button is-transparent is-marginless"
              target="_blank"
              rel="me noopener"
              title={link.name}
              href={link.url}
              aria-label={link.icon ? link.name : null}>
              {link.icon ? <i class={link.icon} aria-hidden="true"></i> : link.name}
            </a>
          ))}
      </div>
    );
  }

  render() {
    const {
      avatar,
      avatarRounded,
      author,
      authorTitle,
      location,
      counter,
      followLink,
      followTitle,
      socialLinks,
    } = this.props;
    return (
      <div class="card widget" data-type="profile">
        <div class="card-content">
          <nav class="level">
            <div class="level-item has-text-centered flex-shrink-1">
              <div>
                {avatar ? (
                  <figure class="image is-128x128 mx-auto mb-2">
                    <img
                      class={'avatar' + (avatarRounded ? ' is-rounded' : '')}
                      src={avatar}
                      alt={author}
                    />
                  </figure>
                ) : null}
                {author ? (
                  <p class="title is-size-4 is-block" style={{ 'line-height': 'inherit' }}>
                    {author}
                  </p>
                ) : null}
                {authorTitle ? <p class="is-size-6 is-block">{authorTitle}</p> : null}
                {location ? (
                  <p class="is-size-6 is-flex justify-content-center">
                    <i class="fas fa-map-marker-alt mr-1"></i>
                    <span>{location}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </nav>
          <nav class="level is-mobile">
            <div class="level-item has-text-centered is-marginless">
              <div>
                <p class="heading">{counter.post.title}</p>
                <a href={counter.post.url}>
                  <p class="title">{counter.post.count}</p>
                </a>
              </div>
            </div>
            <div class="level-item has-text-centered is-marginless">
              <div>
                <p class="heading">{counter.category.title}</p>
                <a href={counter.category.url}>
                  <p class="title">{counter.category.count}</p>
                </a>
              </div>
            </div>
            <div class="level-item has-text-centered is-marginless">
              <div>
                <p class="heading">{counter.tag.title}</p>
                <a href={counter.tag.url}>
                  <p class="title">{counter.tag.count}</p>
                </a>
              </div>
            </div>
          </nav>
          {followLink ? (
            <div class="level">
              <a
                class="level-item button is-primary is-rounded"
                href={followLink}
                target="_blank"
                rel="me noopener">
                {followTitle}
              </a>
            </div>
          ) : null}
          {socialLinks ? this.renderSocialLinks(socialLinks) : null}
        </div>
      </div>
    );
  }
}

/**
 * Adapt Hexo widget options, helpers and site collections to the profile presentation props.
 * Gravatar takes precedence over widget.avatar and the optional defaultAvatar. defaultAvatar is an
 * unresolved path or URL supplied by the caller, not a widget config field; url_for resolves the
 * chosen avatar exactly once. With no avatar source the component renders no figure or image.
 *
 * @see module:util/cache.cacheComponent
 * @example
 * <Profile.Cacheable
 *     site={site}
 *     config={config}
 *     helper={helper}
 *     widget={{ author: 'Author', avatar_rounded: true }}
 *     defaultAvatar="/theme-assets/default-author.png" />
 */
Profile.Cacheable = cacheComponent(Profile, 'widget.profile', (props) => {
  const { site, helper, widget, config = {}, defaultAvatar } = props;
  const {
    avatar,
    gravatar,
    avatar_rounded = false,
    author = config.author,
    author_title,
    location,
    follow_link,
    social_links,
  } = widget;
  const { url_for, _p, __ } = helper;

  function getAvatar() {
    if (gravatar) return gravatarHelper(gravatar, 128);
    if (avatar) return url_for(avatar);
    return defaultAvatar ? url_for(defaultAvatar) : undefined;
  }

  const postCount = site.posts.length;
  const categoryCount = site.categories.filter((category) => category.length).length;
  const tagCount = site.tags.filter((tag) => tag.length).length;
  let socialLinks = null;
  if (social_links) {
    socialLinks = Object.keys(social_links).map((name) => {
      const link = social_links[name];
      if (typeof link === 'string') return { name, url: url_for(link) };
      return { name, url: url_for(link.url), icon: link.icon };
    });
  }

  return {
    avatar: getAvatar(),
    avatarRounded: avatar_rounded,
    author,
    authorTitle: author_title,
    location,
    counter: {
      post: { count: postCount, title: _p('common.post', postCount), url: url_for('/archives/') },
      category: {
        count: categoryCount,
        title: _p('common.category', categoryCount),
        url: url_for('/categories/'),
      },
      tag: { count: tagCount, title: _p('common.tag', tagCount), url: url_for('/tags/') },
    },
    followLink: follow_link ? url_for(follow_link) : undefined,
    followTitle: __('widget.follow'),
    socialLinks,
  };
});

module.exports = Profile;
