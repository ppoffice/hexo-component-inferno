/**
 * A JSX component that renders Open Graph tags.
 * @module view/misc/open_graph
 *
 * @see https://hexo.io/docs/helpers#open-graph
 * @see https://github.com/hexojs/hexo/blob/4.2.0/lib/plugins/helper/open_graph.js
 */
const urlFn = require('url');
const moment = require('moment');
const { Component } = require('inferno');
const { encodeURL, stripHTML, escapeHTML } = require('hexo-util');
const localeMap = {
  en: 'en_US',
  de: 'de_DE',
  es: 'es_ES',
  fr: 'fr_FR',
  hu: 'hu_HU',
  id: 'id_ID',
  it: 'it_IT',
  ja: 'ja_JP',
  ko: 'ko_KR',
  nl: 'nl_NL',
  ru: 'ru_RU',
  th: 'th_TH',
  tr: 'tr_TR',
  vi: 'vi_VN',
};
const localeRegex = new RegExp(Object.keys(localeMap).join('|'), 'i');

/**
 * A JSX component that renders Open Graph tags.
 *
 * @name OpenGraph
 * @see https://hexo.io/docs/helpers#open-graph
 * @see https://github.com/hexojs/hexo/blob/4.2.0/lib/plugins/helper/open_graph.js
 * @example
 * <OpenGraph
 *     type="blog"
 *     title="Page title"
 *     language="Page language"
 *     description="Page description"
 *     date="Page publish date"
 *     updated="Page update date"
 *     author="Page author"
 *     keywords="keyword1,keyword2,..."
 *     images={[ '/path/to/image.png' ]}
 *     url="/path/to/page"
 *     siteName="Site name"
 *     twitterId="Twitter ID"
 *     twitterCard="summary"
 *     twitterSite="Twitter Site"
 *     googlePlus="/path/to/google/plus"
 *     facebookAdmins="Facebook admin ID"
 *     facebookAppId="Facebook APP ID" />
 */
module.exports = class extends Component {
  render() {
    const {
      type,
      title,
      date,
      updated,
      author,
      url,
      siteName,
      twitterCard,
      twitterSite,
      googlePlus,
      facebookAdmins,
      facebookAppId,
    } = this.props;
    let { description, language, images, keywords, twitterId } = this.props;

    const htmlTags = [];

    if (description) {
      description = escapeHTML(stripHTML(description).substring(0, 200).trim()).replace(/\n/g, ' ');
      htmlTags.push(<meta name="description" content={description} />);
    }

    htmlTags.push(<meta property="og:type" content={type || 'website'} />);
    htmlTags.push(<meta property="og:title" content={title} />);
    htmlTags.push(<meta property="og:url" content={encodeURL(url)} />);
    htmlTags.push(<meta property="og:site_name" content={siteName} />);

    if (description) {
      htmlTags.push(<meta property="og:description" content={description} />);
    }

    if (language) {
      if (language.length === 2) {
        language = language.replace(localeRegex, (str) => localeMap[str]);
        htmlTags.push(<meta property="og:locale" content={language} />);
      } else if (language.length === 5) {
        const territory = language.slice(-2);
        const territoryRegex = new RegExp(territory.concat('$'));
        language = language.replace('-', '_').replace(territoryRegex, territory.toUpperCase());
        htmlTags.push(<meta property="og:locale" content={language} />);
      }
    }

    if (!Array.isArray(images)) {
      images = [images];
    }
    images
      .map((path) => {
        if (!urlFn.parse(path).host) {
          // resolve `path`'s absolute path relative to current page's url
          // `path` can be both absolute (starts with `/`) or relative.
          return urlFn.resolve(url, path);
        }
        return path;
      })
      .forEach((path) => {
        htmlTags.push(<meta property="og:image" content={path} />);
      });

    if (date && (moment.isMoment(date) || moment.isDate(date)) && !isNaN(date.valueOf())) {
      htmlTags.push(<meta property="article:published_time" content={date.toISOString()} />);
    }

    if (
      updated &&
      (moment.isMoment(updated) || moment.isDate(updated)) &&
      !isNaN(updated.valueOf())
    ) {
      htmlTags.push(<meta property="article:modified_time" content={updated.toISOString()} />);
    }

    if (author) {
      htmlTags.push(<meta property="article:author" content={author} />);
    }

    if (keywords) {
      if (typeof keywords === 'string') {
        keywords = [keywords];
      }

      keywords
        .map((tag) => {
          return tag.name ? tag.name : tag;
        })
        .filter(Boolean)
        .forEach((keyword) => {
          htmlTags.push(<meta property="article:tag" content={keyword} />);
        });
    }

    htmlTags.push(<meta property="twitter:card" content={twitterCard || 'summary'} />);

    if (images.length) {
      let image = images[0];
      if (!urlFn.parse(image).host) {
        // resolve `path`'s absolute path relative to current page's url
        // `path` can be both absolute (starts with `/`) or relative.
        image = urlFn.resolve(url, image);
      }
      htmlTags.push(<meta property="twitter:image:src" content={image} />);
    }

    if (twitterId) {
      if (twitterId[0] !== '@') {
        twitterId = `@${twitterId}`;
      }
      htmlTags.push(<meta property="twitter:creator" content={twitterId} />);
    }

    if (twitterSite) {
      htmlTags.push(<meta property="twitter:site" content={twitterSite} />);
    }

    if (googlePlus) {
      htmlTags.push(<link rel="publisher" href={googlePlus} />);
    }

    if (facebookAdmins) {
      htmlTags.push(<meta property="fb:admins" content={facebookAdmins} />);
    }

    if (facebookAppId) {
      htmlTags.push(<meta property="fb:app_id" content={facebookAppId} />);
    }

    return <>{htmlTags}</>;
  }
};
