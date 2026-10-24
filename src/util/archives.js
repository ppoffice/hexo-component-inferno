/**
 * Internal option and grouping logic for the archives widget. No Hexo imports, helpers or JSX.
 * @module util/archives
 * @private
 */

function firstSet(...values) {
  return values.find((value) => value !== null && typeof value !== 'undefined');
}

/**
 * Resolve archive option aliases/defaults without coercing false, zero or empty strings.
 * @param {Object} widget Archives widget options.
 * @returns {Object} Resolved grouping, ordering, formatting, limit and count-display options.
 */
function resolveArchiveOptions(widget) {
  const groupBy = firstSet(widget.group_by, 'monthly');
  const order = firstSet(widget.order, -1);
  const { format, amount } = widget;
  const showCount = firstSet(widget.show_count, widget.showCount, true);
  return { groupBy, order, format, amount, showCount };
}

// Same conversion as Hexo's toMomentLocale, without depending on Hexo's private modules.
function toMomentLocale(lang) {
  if (lang === undefined) return undefined;
  if (!lang || lang === 'en' || lang === 'default') return 'en';
  return lang.toLowerCase().replace('_', '-');
}

/**
 * Group already ordered posts by consecutive formatted names and apply the archive limit.
 * The first date in each group supplies its year/month even when a custom format merges years.
 * Sorting stays with the Hexo collection adapter; this function only needs forEach and date.clone.
 * @param {{forEach: Function}} posts Ordered records with Moment-compatible date values.
 * @param {Object} options groupBy/format/amount plus the selected language code and timezone.
 * @returns {Object} Selected groups ({name, year, month, count}) and hasMore; URLs remain unresolved.
 */
function groupArchives(posts, options) {
  const { groupBy, format, amount, timezone } = options;
  const language = toMomentLocale(options.language);
  const groups = [];
  let length = 0;

  posts.forEach((post) => {
    let date = post.date.clone();
    if (timezone) date = date.tz(timezone);
    if (language) date = date.locale(language);

    const year = date.year();
    const month = date.month() + 1;
    const name = date.format(format || (groupBy === 'monthly' ? 'MMMM YYYY' : 'YYYY'));
    const last = groups[length - 1];
    if (!last || last.name !== name) {
      length = groups.push({ name, year, month, count: 1 });
    } else {
      last.count++;
    }
  });

  const hasMore = amount > 0 && groups.length > amount;
  return { groups: hasMore ? groups.slice(0, amount) : groups, hasMore };
}

module.exports = { resolveArchiveOptions, groupArchives };
