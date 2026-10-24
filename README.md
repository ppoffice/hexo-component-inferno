# hexo-component-inferno

[![Test](https://github.com/ppoffice/hexo-component-inferno/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/ppoffice/hexo-component-inferno/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/hexo-component-inferno.svg)](https://www.npmjs.com/package/hexo-component-inferno)
[![Coverage Status](https://img.shields.io/coveralls/ppoffice/hexo-component-inferno.svg)](https://coveralls.io/r/ppoffice/hexo-component-inferno?branch=master)

Ready-made [Inferno.js](https://infernojs.org/) layout components, Hexo extensions, and configuration tools
for building [Hexo](https://hexo.io/) themes in JSX. It is the component library behind
[Icarus](https://github.com/ppoffice/hexo-theme-icarus), and any theme rendered with
[hexo-renderer-inferno](https://github.com/hexojs/hexo-renderer-inferno) can use it.

- **Components**: comment systems, search, share buttons, donation buttons, widgets, analytics and other
  plugins, and SEO metadata, each with a JSON schema for its configuration.
- **Hexo extensions**: generators, helpers, tag plugins, and a filter that merges the theme config into
  the template locals.
- **Configuration tools**: a JSON schema loader that validates the theme config and generates its default
  values, and a framework for migrating configs between theme versions.

## Requirements

- Node.js 14 or later
- Hexo 7.1.1 or later, or Hexo 8 (a peer dependency)

## Install

```sh
npm install hexo-component-inferno
```

The components render [Bulma](https://bulma.io/) markup and [Font Awesome](https://fontawesome.com/)
icons, so your theme needs to include their styles.

## Usage

The examples below follow how Icarus uses this library. See its
[`include/register.js`](https://github.com/ppoffice/hexo-theme-icarus/blob/master/include/register.js) and
[`layout/common/`](https://github.com/ppoffice/hexo-theme-icarus/tree/master/layout/common) for a complete
example.

### Register the Hexo extensions

Register the extensions you need from a script of your theme, for example `scripts/index.js`:

```js
require('hexo-component-inferno/lib/hexo/filter/locals')(hexo);
require('hexo-component-inferno/lib/hexo/generator/assets')(hexo);
require('hexo-component-inferno/lib/hexo/helper/cdn')(hexo);
require('hexo-component-inferno/lib/hexo/tag/message')(hexo);
// ...
require('hexo-component-inferno/lib/core/view').init(hexo);
```

| Module                      | What it registers                                                                                                                                                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hexo/filter/locals`        | Merges the theme config, `_config.post.yml` / `_config.page.yml`, and the front matter of the page into `config`, and puts all helpers in `helper`. Most components expect these locals.                                                            |
| `hexo/generator/assets`     | Copies the browser scripts in [`asset/`](asset) (search, table of contents) to the site, unless the theme has a file at the same path.                                                                                                              |
| `hexo/generator/insight`    | `content.json`, the index of the Insight search.                                                                                                                                                                                                    |
| `hexo/generator/manifest`   | `manifest.json` for web apps.                                                                                                                                                                                                                       |
| `hexo/generator/categories` | The `/categories/` page.                                                                                                                                                                                                                            |
| `hexo/generator/category`   | The page of each category.                                                                                                                                                                                                                          |
| `hexo/generator/tags`       | The `/tags/` page.                                                                                                                                                                                                                                  |
| `hexo/helper/cdn`           | `cdn(package, version, file)`, `fontcdn(name, type)` and `iconcdn()`, which build URLs for the CDN providers set in `providers.cdn`, `providers.fontcdn` and `providers.iconcdn`. `providers.cdn_overrides` sets a different CDN for some packages. |
| `hexo/helper/page`          | `is_categories()` and `is_tags()`.                                                                                                                                                                                                                  |
| `hexo/tag/message`          | The `{% message %}` tag for Bulma message boxes.                                                                                                                                                                                                    |
| `hexo/tag/tabs`             | The `{% tabs %}` tag for Bulma tabs.                                                                                                                                                                                                                |

### Render components

Every component lives in `lib/view/<category>/<name>.js`. Each one has a `Cacheable` version that takes
the template locals (`config`, `page`, `helper` and `site`) together with its own section of the theme
config, maps them to its props, and caches the rendered element:

```jsx
const { Component } = require('inferno');
const view = require('hexo-component-inferno/lib/core/view');

module.exports = class extends Component {
  render() {
    const { config, page, helper } = this.props;
    const { comment } = config;
    // Resolves layout/comment/<type>.jsx in the theme first, then lib/view/comment/<type>.js here
    const Comment = view.require('comment/' + comment.type);
    return <Comment.Cacheable config={config} page={page} helper={helper} comment={comment} />;
  }
};
```

Because `view.require()` looks in the theme's `layout/` directory first, a theme can replace any component
by adding a file with the same path.

### Validate the theme config

The JSON schema of each component is in `lib/schema/<category>/<name>.json`. Load your theme's schema
with `SchemaLoader`. A `$ref` is resolved from the directories you pass in first, then from the schemas of
this library:

```js
const { SchemaLoader } = require('hexo-component-inferno/lib/core/schema');

const loader = SchemaLoader.load(require('./schema/config.json'), [path.join(__dirname, 'schema')]);
const schema = loader.getSchema('/config.json');

const result = schema.validate(themeConfig); // true, or a list of errors
const defaults = schema.getDefaultValue().toYaml(); // a commented default config
```

For example, `{ "$ref": "/comment/giscus.json" }` in your schema refers to the Giscus schema of this
library. `lib/core/migrate` upgrades existing configs between theme versions with a chain of `Migration`
classes.

### Utilities

| Module            | Description                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `util/cache`      | `cacheComponent()`, which builds the `Cacheable` components.                                                      |
| `util/classname`  | Builds a class name string from a string, an array, or an object of class names to booleans.                      |
| `util/yaml`       | YAML parse and stringify for theme configs, writing `null` as an empty value.                                     |
| `util/script`     | Builds inline scripts that load external scripts without blocking the page and work with PJAX.                    |
| `util/appearance` | Builds inline expressions that follow the light, dark, or auto appearance of the page (`<html data-appearance>`). |
| `util/i18n`       | Translates a key with a fallback when the theme has no translation.                                               |
| `util/deprecate`  | Warns once when a deprecated component is rendered.                                                               |

## Components

| Category  | Components                                                                                                                                                                                                                             |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `comment` | Artalk, Beaudar, Changyan, Cusdis, Disqus, DisqusJS, Facebook, Giscus, Gitalk, Gitment, Isso, LiveRe, Twikoo, Utterances, Valine, Waline                                                                                               |
| `search`  | Algolia, Baidu, Google CSE, Insight                                                                                                                                                                                                    |
| `share`   | AddThis, AddToAny, Baidu Share, Share.js, ShareThis                                                                                                                                                                                    |
| `donate`  | Afdian, Alipay, Buy Me a Coffee, Patreon, PayPal, WeChat                                                                                                                                                                               |
| `widget`  | AdSense, archives, categories, follow.it, GitHub contribution calendar, links, recent posts, email subscription, tags, table of contents                                                                                                                             |
| `plugin`  | Baidu Analytics, Bing Webmaster, Busuanzi, CNZZ, cookie consent, gallery, Google Analytics, Hotjar, KaTeX, MathJax, Matomo, outdated browser warning, progress bar, StatCounter, Twitter conversion tracking, Umami, Waline page views |
| `misc`    | Article licensing, meta tags, Open Graph, paginator, structured data, web app                                                                                                                                                          |
| `common`  | Article media (a thumbnail with a title and date)                                                                                                                                                                                      |

The components below are deprecated because their services have shut down or are shutting down. They print
a warning when they are rendered, and will be removed in the next major version.

| Component                | Reason                                                                         | Alternatives               |
| ------------------------ | ------------------------------------------------------------------------------ | -------------------------- |
| `share/addthis`          | AddThis shut down on May 31, 2023.                                             | AddToAny, ShareThis        |
| `comment/gitment`        | Gitment is no longer maintained, and its GitHub sign-in proxy no longer works. | Giscus, Utterances, Gitalk |
| `comment/valine`         | LeanCloud, where Valine stores the comments, shuts down on January 12, 2027.   | Waline, Twikoo             |
| `widget/subscribe_email` | Google FeedBurner stopped email subscriptions in July 2021.                    | follow.it                  |

The [API documentation](https://ppoffice.github.io/hexo-component-inferno/) lists the props of every
component and the options of every module.

## Development

```sh
npm install
npm run build         # compile src/ to lib/
npm test              # run the tests in lib/ (build first)
npm run test-cov      # run the tests with coverage
npm run lint          # ESLint
npm run format-check  # Prettier; `npm run format` fixes it
npm run docs          # generate the API documentation in doc/
```

Tests sit next to the source files (`*.test.js` / `*.test.jsx`) and run against the compiled files in
`lib/`, so run `npm run build` after changing `src/`.

The tests use Hexo 8, which needs Node.js 20.19 or later. CI also tests Node.js 14 with Hexo 7.

Releases are published to npm by GitHub Actions when a GitHub release is published.

## License

[MIT](LICENSE)
