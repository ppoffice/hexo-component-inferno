/**
 * A simple article overview JSX component.
 * @module view/common/article_media
 */
const { Component } = require('inferno');

/**
 * A simple article overview JSX component.
 * <p>
 * Its thumbnail is only loaded when it is about to be scrolled to: the component lists posts in
 * the archives and in the sidebar, which is below the content on mobile.
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
      categoryTags.push(<a href={category.url}>{category.name}</a>);
      if (i < categories.length - 1) {
        categoryTags.push(' / ');
      }
    });

    return (
      <article class="media">
        {thumbnail ? (
          <figure class="media-left">
            <a class="image" href={url}>
              <img src={thumbnail} alt={title} loading="lazy" decoding="async" />
            </a>
          </figure>
        ) : null}
        <div class="media-content">
          <p class="date">
            <time dateTime={dateXml}>{date}</time>
          </p>
          <p class="title">
            <a href={url}>{title}</a>
          </p>
          {categoryTags.length ? <p class="categories">{categoryTags}</p> : null}
        </div>
      </article>
    );
  }
};
