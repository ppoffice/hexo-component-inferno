const path = require('path');
const view = require('./view');
const DisqusLibraryView = require('../view/comment/disqus');
const OpenGraphLibraryView = require('../view/misc/open_graph');

const themeDir = path.join(__dirname, '../../fixture');
const ExampleFixtureView = require(themeDir + '/layout/example');
const DisqusFixtureView = require(themeDir + '/layout/comment/disqus');

beforeAll(() => {
  view.init({ theme_dir: themeDir });
});

describe('Correctly resolve path of the view', () => {
  test('when theme and this library both have the view file', () => {
    expect(view.require.resolve('comment/disqus')).toBe(
      path.join(themeDir, 'layout/comment/disqus.jsx'),
    );
  });

  test('when only this library has the view file', () => {
    expect(view.require.resolve('misc/open_graph')).toBe(
      path.join(__dirname, '../view/misc/open_graph.js'),
    );
  });

  test('when only the theme has the view file', () => {
    expect(view.require.resolve('example')).toBe(path.join(themeDir, 'layout/example.jsx'));
  });

  test("don' resolve absolute path", () => {
    const absPath = path.join(__dirname, '../view/comment/disqus.js');
    expect(view.require.resolve(absPath)).toBe(absPath);
  });
});

describe('Correctly require() the view', () => {
  test('when theme and this library both have the view file', () => {
    expect(view.require('comment/disqus')).toBe(DisqusFixtureView);
  });

  test('when only this library has the view file', () => {
    expect(view.require('misc/open_graph')).toBe(OpenGraphLibraryView);
  });

  test('when only the theme has the view file', () => {
    expect(view.require('example')).toBe(ExampleFixtureView);
  });

  test("don' resolve absolute path", () => {
    expect(view.require(path.join(__dirname, '../view/comment/disqus'))).toBe(DisqusLibraryView);
  });
});
