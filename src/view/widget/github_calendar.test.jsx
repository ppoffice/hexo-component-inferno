const { renderToStaticMarkup } = require('inferno-server');
const GithubCalendar = require('./github_calendar');
const { SchemaLoader } = require('../../core/schema');

const render = (widget, helper = { __: (key) => key }) =>
  renderToStaticMarkup(<GithubCalendar.Cacheable widget={widget} helper={helper} />);

test('Renders with English fallbacks when the theme has no translations', () => {
  const html = render({ username: 'octocat' });
  expect(html).toContain('GitHub Contributions');
  expect(html).toContain('Loading contributions…');
  expect(html).toContain('Could not load contributions. Open GitHub to view them.');
  expect(html).toContain('data-username="octocat"');
  expect(html).not.toContain('>octocat<');
  expect(html).not.toContain('<script');
  expect(html).not.toContain('<img');
});

test('Uses translated labels, a custom title and a custom color', () => {
  const helper = {
    __: (key) =>
      ({
        'widget.github_calendar': '贡献日历',
        'widget.github_calendar_loading': '加载中',
        'widget.github_calendar_error': '加载失败',
      })[key],
  };
  const html = render({ username: ' octocat ', color: '#abcdef' }, helper);
  expect(html).toContain('贡献日历');
  expect(html).toContain('加载中');
  expect(html).toContain('data-error="加载失败"');
  expect(html).toContain('--github-calendar-color:#abcdef');
  expect(html).toContain('data-username="octocat"');
  expect(render({ username: 'octocat', title: 'Activity' })).toContain('>Activity<');
});

test('Hides missing or invalid usernames and ignores invalid custom colors', () => {
  for (const username of [undefined, null, '', ' ', '../bad', 'a'.repeat(40), 42]) {
    expect(render({ username })).not.toContain('class="card widget"');
  }
  expect(render({ username: 'octocat', color: 'red/other' })).not.toContain('style=');
  expect(
    renderToStaticMarkup(<GithubCalendar.Cacheable widget={{ username: 'octocat' }} />),
  ).toContain('GitHub Contributions');
});

test('Validates the library-owned widget schema', () => {
  const def = require('../../schema/widget/github_calendar.json');
  const schema = SchemaLoader.load(def).getSchema(def.$id);
  expect(schema.validate({ type: 'github_calendar', username: 'octocat', color: '#abcdef' })).toBe(
    true,
  );
  expect(schema.validate({ type: 'github_calendar', username: '../bad' })).not.toBe(true);
  expect(schema.validate({ type: 'github_calendar', username: 'octocat', color: 'red' })).not.toBe(
    true,
  );
});
