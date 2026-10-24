/**
 * Create the DOM-independent Insight query engine.
 * Keep the factory self-contained: the search view serializes it into an inline script, including
 * when used without the Hexo asset generator or with a CDN-hosted insight.js.
 * @module util/insight-search
 * @returns {Function} Search (index, query), returning parsed keywords and ranked result sections.
 */
function createInsightSearch() {
  const content = { fields: ['title', 'text'], weights: [3, 1] };
  const taxonomy = { fields: ['name', 'slug'], weights: [1, 1] };
  const sections = { posts: content, pages: content, categories: taxonomy, tags: taxonomy };

  function parseKeywords(query) {
    return query
      .split(' ')
      .filter((keyword) => {
        return !!keyword;
      })
      .map((keyword) => {
        return keyword.toLowerCase();
      });
  }

  // Every keyword must occur in at least one own field; keywords may span different fields.
  function filter(keywords, obj, fields) {
    const containKeywords = keywords.filter((keyword) => {
      const containFields = fields.filter((field) => {
        if (!Object.prototype.hasOwnProperty.call(obj, field)) {
          return false;
        }
        if (obj[field].toLowerCase().indexOf(keyword) > -1) {
          return true;
        }
        return false;
      });
      if (containFields.length > 0) {
        return true;
      }
      return false;
    });
    return containKeywords.length === keywords.length;
  }

  // Count non-overlapping occurrences of a literal lowercase keyword, not a regular expression.
  function countMatches(text, keyword) {
    let count = 0;
    for (let i = text.indexOf(keyword); i !== -1; i = text.indexOf(keyword, i + keyword.length)) {
      count++;
    }
    return count;
  }

  function weight(keywords, obj, fields, weights) {
    let value = 0;
    keywords.forEach((keyword) => {
      fields.forEach((field, index) => {
        if (Object.prototype.hasOwnProperty.call(obj, field)) {
          value += countMatches(obj[field].toLowerCase(), keyword) * weights[index];
        }
      });
    });
    return value;
  }

  // Weigh each matching item once. Equal weights retain the input order, including an empty query.
  function topItems(items, keywords, config) {
    return items
      .filter((item) => {
        return filter(keywords, item, config.fields);
      })
      .map((item) => {
        return { item, weight: weight(keywords, item, config.fields, config.weights) };
      })
      .sort((a, b) => {
        return b.weight - a.weight;
      })
      .slice(0, 5)
      .map((result) => {
        return result.item;
      });
  }

  return function search(json, query) {
    const keywords = parseKeywords(query);
    const results = {};
    Object.keys(sections).forEach((section) => {
      results[section] = topItems(json[section], keywords, sections[section]);
    });
    return { keywords, results };
  };
}

module.exports = createInsightSearch;
