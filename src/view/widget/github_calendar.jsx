/**
 * Responsive GitHub contribution calendar widget.
 * @module view/widget/github_calendar
 */
const { Component } = require('inferno');
const { cacheComponent } = require('../../util/cache');
const { translate } = require('../../util/i18n');

/**
 * Render the calendar shell. Themes load asset/js/github-calendar.js, call
 * window.HexoGithubCalendar.init() after each page render, and provide calendar styles.
 *
 * @example
 * <GithubCalendar username="octocat" title="GitHub Contributions"
 *     loading="Loading contributions…" error="Could not load contributions." />
 */
class GithubCalendar extends Component {
  render() {
    const { username, title, color, loading, error } = this.props;
    if (!username) {
      return null;
    }
    return (
      <div class="card widget" data-type="github_calendar">
        <div class="card-content">
          <h3 class="menu-label">{title}</h3>
          <div
            class="github-calendar-chart"
            data-username={username}
            data-error={error}
            style={color ? { '--github-calendar-color': '#' + color } : null}>
            <p class="github-calendar-status is-size-7" role="status">
              {loading}
            </p>
            <a
              class="github-calendar-link"
              href={'https://github.com/' + username + '?tab=overview'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={title}>
              <span class="github-calendar-grid"></span>
            </a>
            <noscript>
              <a href={'https://github.com/' + username}>{title}</a>
            </noscript>
          </div>
        </div>
      </div>
    );
  }
}

/** Cacheable calendar using the theme's translations, with English fallbacks. */
GithubCalendar.Cacheable = cacheComponent(GithubCalendar, 'widget.github_calendar', (props) => {
  const { widget = {}, helper = {} } = props;
  const username = typeof widget.username === 'string' ? widget.username.trim() : '';
  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username)) {
    return null;
  }
  const color = typeof widget.color === 'string' ? widget.color.replace(/^#/, '') : '';
  return {
    username,
    title: widget.title || translate(helper.__, 'widget.github_calendar', 'GitHub Contributions'),
    color: /^[a-f\d]{6}$/i.test(color) ? color : null,
    loading: translate(helper.__, 'widget.github_calendar_loading', 'Loading contributions…'),
    error: translate(
      helper.__,
      'widget.github_calendar_error',
      'Could not load contributions. Open GitHub to view them.',
    ),
  };
});

module.exports = GithubCalendar;
