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

### Shared Gallery runtime (4.3.0, unreleased)

`require('hexo-component-inferno/lib/util/gallery')` exports a self-contained inline installer string,
like `util/searchbox`. Insert it in a script before your content initialization code. The standalone
Gallery component already includes it; themes must also install it when Gallery is disabled, if they
want the basic image links and alt-text captions. Installation alone loads nothing and changes no DOM.

```jsx
const gallery = require('hexo-component-inferno/lib/util/gallery');

<script data-pjax dangerouslySetInnerHTML={{ __html: gallery }} />;
```

The installer exposes one method:

```js
// Basic enhancement only, including when Gallery is disabled:
window.HexoGallery.init();
// Explicitly opt into SDKs already loaded by Gallery (this never downloads them):
window.HexoGallery.init(document, { lightGallery: true, justifiedGallery: true });
// Or enhance a specific content element, without requiring an .article class:
window.HexoGallery.init(document.querySelector('main'), { lightGallery: true });
```

For a document root, image links/captions and lightGallery target `.article`; justifiedGallery targets
all `.justified-gallery` elements. An element root scopes all work to that element. Linked images and
`.not-gallery-item` images are left alone. Captions are text, not HTML; visual styling stays in the
theme. Reinstalling and repeated init are safe. The latest flags for each root are retried on DOM ready,
window load and subsequent script load events, so missing SDKs can arrive later, including after PJAX.
Explicit `init` calls can also retry. Omitted flags disable new plugin initialization, not previously
created instances. After replacing content, call `init` again with the new page's flags; do not retain
an enabled configuration for a disabled page.

On the same root, replacing, adding or reordering items refreshes enabled SDKs. Existing external
instances are reused when their items already match. For lightGallery 1.10.0 (which has no refresh
method), the runtime removes its old `click.lgcustom` handlers, updates the instance's `$items` and
calls its `init` once; settings and the instance are retained. Justified Gallery 3.8.1 refreshes its
entries through its existing plugin entry point, retaining the controller. These are version-specific
adapters for the pinned SDKs, not a general plugin lifecycle. Before a JG refresh, its previous width
timer is cleared because 3.8.1 starts another timer on every init. Disabling flags does not perform
this refresh or destroy instances; basic image enhancement still runs.
JG snapshots include filtered-out DOM items and capture the order after SDK randomize/sort. On first
adopting an external controller, its existing filtered entries are compared with DOM entries not
marked `jg-filtered`, without reevaluating the user's filter or randomizing an unchanged gallery.
Snapshots also remember the SDK's entries array reference: an official external update such as
`justifiedGallery('norewind')` is adopted when its entries match the current visible DOM. A changed
reference alone does not hide additional DOM items that the SDK has not processed yet.

The component's optional SDK and init scripts intentionally do not carry `data-pjax`: enabling a
plugin must not change a consuming theme's global PJAX matching-node count. Themes keep their shared
installer/main scripts unconditional, load optional SDK resources through their existing plugin
loader, and call `init` with the current page's flags. SDK load retries never restore an old flag set.

Themes should install this runtime before their main script, replace their duplicate Gallery code
with `init(document, { lightGallery: enabled, justifiedGallery: enabled })`, and keep the existing
Gallery component responsible for the SDK/CSS URLs. jQuery must load before the third-party SDKs;
basic image enhancement itself does not require jQuery. No additional runtime asset request is needed.

**Version requirement:** this new entry point requires 4.3.0 and is not in the published 4.2.2 package.
This checkout identifies as the unreleased 4.3.0 development line; use this built workspace checkout
during development. A consuming theme must require 4.3.0 or later before shipping. Do not remove the
theme's old implementation while claiming compatibility with published 4.2.2. Coordinate the library
release and theme dependency change together; this change does not publish or tag a release.

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
