/**
 * A JSX component that renders simple Google structured data.
 * @module view/misc/structured_data
 */
const urlFn = require('url');
const moment = require('moment');
const { Component } = require('inferno');
const { stripHTML, escapeHTML } = require('hexo-util');

/**
 * A JSX component that renders simple Google structured data.
 *
 * @name StructuredData
 * @example
 * <StructuredData
 *     title="Page title"
 *     url="/page/url"
 *     author="Page author name"
 *     publisher="Page publisher name"
 *     publisherLogo="/path/to/logo"
 *     description="Page description"
 *     images={[ '/path/to/image' ]}
 *     date="Page publish date"
 *     updated="Page update date" />
 */
module.exports = class extends Component {
  render() {
    const { title, url, author, publisher } = this.props;
    let { description, images, date, updated, publisherLogo } = this.props;

    if (description) {
      description = escapeHTML(stripHTML(description).substring(0, 200).trim()).replace(/\n/g, ' ');
    }

    if (!Array.isArray(images)) {
      images = [images];
    }
    images = images
      .map((path) => {
        if (!urlFn.parse(path).host) {
          // resolve `path`'s absolute path relative to current page's url
          // `path` can be both absolute (starts with `/`) or relative.
          return urlFn.resolve(url, path);
        }
        return path;
      })
      .filter(
        (url) =>
          url.endsWith('.jpg') ||
          url.endsWith('.png') ||
          url.endsWith('.gif') ||
          url.endsWith('.webp'),
      );

    if (typeof publisherLogo === 'string' && !urlFn.parse(publisherLogo).host) {
      publisherLogo = urlFn.resolve(url, publisherLogo);
    }

    if (date && (moment.isMoment(date) || moment.isDate(date)) && !isNaN(date.valueOf())) {
      date = date.toISOString();
    }

    if (
      updated &&
      (moment.isMoment(updated) || moment.isDate(updated)) &&
      !isNaN(updated.valueOf())
    ) {
      updated = updated.toISOString();
    }

    const data = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': url,
      },
      headline: title,
      image: images,
      datePublished: date,
      dateModified: updated,
      author: {
        '@type': 'Person',
        name: author,
      },
      publisher: {
        '@type': 'Organization',
        name: publisher,
        logo: {
          '@type': 'ImageObject',
          url: publisherLogo,
        },
      },
      description: description,
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}></script>
    );
  }
};
