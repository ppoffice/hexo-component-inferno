/**
 * Internal category option and tree preparation, independent of Hexo initialization and JSX.
 * @module util/categories
 * @private
 */

function firstSet(...values) {
  return values.find((value) => value !== null && typeof value !== 'undefined');
}

/**
 * Resolve aliases/defaults without coercing explicit false, zero or empty strings.
 * @param {Object} widget Categories widget options.
 * @returns {Object} order, orderBy, showCurrent and showCount.
 */
function resolveCategoryOptions(widget) {
  const order = firstSet(widget.order, 1);
  const orderBy = firstSet(widget.order_by, widget.orderBy, 'name');
  const showCurrent = firstSet(widget.show_current, widget.showCurrent, false);
  const showCount = firstSet(widget.show_count, widget.showCount, true);
  return { order, orderBy, showCurrent, showCount };
}

/**
 * Parse depth only after the caller's empty-source check, retaining parseInt and zero-as-unlimited.
 * @param {*} depth Widget depth.
 * @param {*} fallback Legacy top-level props.depth.
 * @returns {number} Parsed depth, or zero for an unset/unparseable value.
 */
function resolveCategoryDepth(depth, fallback) {
  return parseInt(firstSet(depth, fallback), 10) || 0;
}

function prepareQuery(categories, parent, orderBy, order) {
  const query = {};
  if (parent) query.parent = parent;
  else query.parent = { $exists: false };
  return categories
    .find(query)
    .sort(orderBy, order)
    .filter((cat) => cat.length);
}

function currentCategory(cat, page) {
  let isCurrent = false;
  for (let j = 0; j < cat.length; j++) {
    const post = cat.posts.data[j];
    if (post && post._id === page._id) {
      isCurrent = true;
      break;
    }
  }
  // Preserve both the raw prefix test and its falsey/unset result, rather than coercing to boolean.
  return isCurrent || (page.base && page.base.startsWith(cat.path));
}

/**
 * Prepare the category tree through the collection's existing find/sort/filter/map contract.
 * URLs are resolved in the original depth-first postorder, even for subsequently hidden roots.
 * Keeping the URL helper at this point also preserves helper calls before later query/current errors.
 * @param {Object} categories Queryable source with the existing find/sort/filter/map contract.
 * @param {Object} options Resolved order/orderBy/showCurrent/depth plus raw amount.
 * @param {Object} page Current page; an unset page skips current checks.
 * @param {Function} url_for Existing URL helper, not a generic node projection.
 * @returns {Object} Selected categories ({children, isCurrent, name, count, url}) and hasMore.
 */
function prepareCategories(categories, options, page, url_for) {
  const { order, orderBy, showCurrent, depth, amount } = options;

  function hierarchicalList(level, parent) {
    return prepareQuery(categories, parent, orderBy, order).map((cat) => {
      let children = [];
      if (!depth || level + 1 < depth) children = hierarchicalList(level + 1, cat._id);
      let isCurrent = false;
      if (showCurrent && page) isCurrent = currentCategory(cat, page);
      return { children, isCurrent, name: cat.name, count: cat.length, url: url_for(cat.path) };
    });
  }

  const list = hierarchicalList(0);
  const hasMore = amount > 0 && list.length > amount;
  return { categories: hasMore ? list.slice(0, amount) : list, hasMore };
}

module.exports = { resolveCategoryOptions, resolveCategoryDepth, prepareCategories };
