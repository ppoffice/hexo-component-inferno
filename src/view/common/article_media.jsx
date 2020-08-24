/**
 * A simple article overview JSX component.
 * @module view/common/article_media
 */
const { Component } = require('inferno');

/**
 * A simple article overview JSX component.
 *
 * @name ArticleMedia
 * @example
 * <ArticleMedia
 *     thumbnail="/path/to/thumbnail/image.png"
 *     url="/path/to/article"
 *     title="Article title"
 *     date="Article publish date"
 *     dateXml="Article publish date in XML format (see https://hexo.io/docs/helpers#date-xml)"
 *     categories={[
 *         { url: '/path/to/category', name: 'Category name' }
 *     ]} />
 */
module.exports = class extends Component {
  render() {
    const { thumbnail, url, title, date, dateXml, categories } = this.props;

    const categoryTags = [];
    categories.forEach((category, i) => {
      categoryTags.push(
        <a class="link-muted" href={category.url}>
          {category.name}
        </a>,
      );
      if (i < categories.length - 1) {
        categoryTags.push(' / ');
      }
    });

    return (
      <article class="media">
        {thumbnail ? (
          <a href={url} class="media-left">
            <p class="image is-64x64">
              <img class="fill" src={thumbnail} alt={title} />
            </p>
          </a>
        ) : null}
        <div class="media-content size-small">
          <p>
            <time dateTime={dateXml}>{date}</time>
          </p>
          <p class="title is-6">
            <a href={url} class="link-muted">
              {title}
            </a>
          </p>
          <p class="is-uppercase">{categoryTags.length ? categoryTags : null}</p>
        </div>
      </article>
    );
  }
};
