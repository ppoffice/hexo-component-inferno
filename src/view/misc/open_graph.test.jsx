const { renderToString } = require('inferno-server');
const OpenGraph = require('./open_graph');
const { SchemaLoader } = require('../../core/schema');
const schema = require('../../schema/misc/open_graph.json');

test('Legacy Google+ values are ignored without changing other metadata, with one migration warning', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const props = {
    url: 'https://example.com/post/',
    title: 'Title',
    description: 'Description',
    images: ['/cover.png'],
    language: 'en',
    author: 'Author',
    date: new Date(0),
    twitterCard: 'summary_large_image',
    twitterId: 'author',
    twitterSite: '@site',
    facebookAdmins: 'admin',
    facebookAppId: 'app',
  };
  try {
    const baseline = renderToString(<OpenGraph {...props} />);
    for (const googlePlus of [null, '', undefined]) {
      expect(renderToString(<OpenGraph {...props} googlePlus={googlePlus} />)).toBe(baseline);
    }
    expect(warn).not.toHaveBeenCalled();
    for (const googlePlus of ['https://plus.google.com/legacy', 'https://example.com/old']) {
      expect(renderToString(<OpenGraph {...props} googlePlus={googlePlus} />)).toBe(baseline);
    }
    expect(baseline).not.toContain('rel="publisher"');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('head.open_graph.google_plus is deprecated.'),
    );
    expect(warn.mock.calls[0][0]).toContain('remove google_plus');
  } finally {
    warn.mockRestore();
  }
});

test('The schema accepts old Google+ configuration and marks it as deprecated and ignored', () => {
  const loader = new SchemaLoader();
  loader.addSchema(schema);
  const openGraph = loader.getSchema(schema.$id);
  for (const google_plus of [null, '', 'https://plus.google.com/legacy']) {
    expect(openGraph.validate({ google_plus, twitter_card: 'summary_large_image' })).toBe(true);
  }
  expect(schema.properties.google_plus.deprecated).toBe(true);
  expect(openGraph.getDefaultValue().toYaml()).toContain('deprecated; ignored');
});
