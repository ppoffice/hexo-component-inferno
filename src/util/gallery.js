/**
 * Inline Gallery installer shared by the standalone component and consuming themes.
 * Installing it does not enable or download either SDK. Keep it self-contained after Babel so it
 * can also be used without the Hexo asset generator.
 * @module util/gallery
 */
function installGallery(window) {
  if (window.HexoGallery) return;

  const document = window.document;
  const requests = new Map();
  const justifiedItems = new WeakMap();

  function sameItems(items, current) {
    return (
      items.length === current.length && Array.from(items).every((item, i) => item === current[i])
    );
  }

  function enhance(container) {
    container.querySelectorAll('img:not(.not-gallery-item)').forEach((image) => {
      if (image.closest('a')) return;
      const link = document.createElement('a');
      link.className = 'gallery-item';
      const src = image.getAttribute('src');
      if (src !== null) link.setAttribute('href', src);
      image.parentNode.insertBefore(link, image);
      link.appendChild(image);
      if (image.alt) {
        const caption = document.createElement('p');
        caption.className = 'has-text-centered is-size-6 caption';
        caption.textContent = image.alt;
        link.appendChild(caption);
      }
    });
  }

  function apply(root, options) {
    const containers = root === document ? root.querySelectorAll('.article') : [root];
    containers.forEach(enhance);
    // Do not let lightGallery capture an incomplete article while HTML is still being parsed.
    if (document.readyState === 'loading') return;
    const $ = window.jQuery || window.$;
    if (!$ || !$.fn) return;

    if (options.lightGallery && typeof $.fn.lightGallery === 'function') {
      containers.forEach((container) => {
        const $container = $(container);
        const instance = $container.data('lightGallery');
        if (!instance) {
          $container.lightGallery({ selector: '.gallery-item' });
          return;
        }
        // 1.10.0's entry point calls init again even for existing instances, duplicating handlers.
        // There is no refresh API: retain its settings and refresh only changed DOM memberships.
        if (instance.s.dynamic) return;
        const $scope = instance.s.selectWithin ? $(instance.s.selectWithin) : $container;
        let $items = $container;
        if (instance.s.selector !== 'this') {
          $items = instance.s.selector ? $scope.find(instance.s.selector) : $container.children();
        }
        if (sameItems(instance.$items, $items)) return;
        instance.$items.off('click.lgcustom');
        instance.$items = $items;
        instance.init();
      });
    }
    if (options.justifiedGallery && typeof $.fn.justifiedGallery === 'function') {
      const galleries = Array.from(root.querySelectorAll('.justified-gallery'));
      if (root !== document && root.matches('.justified-gallery')) galleries.unshift(root);
      galleries.forEach((gallery) => {
        const $gallery = $(gallery);
        $gallery.find('> p > .gallery-item').unwrap();
        const controller = $gallery.data('jg.controller');
        if (controller) {
          const items = controller.getAllEntries();
          const previous = justifiedItems.get(controller);
          // External controllers expose filtered entries, not the full DOM collection. Adopt an
          // unchanged controller without rerunning its filter/randomize, then track all DOM items.
          let unchanged;
          if (previous && previous.entries === controller.entries) {
            unchanged = sameItems(previous.items, items);
          } else {
            // updateEntries replaces this array, including official 'norewind' updates. Only
            // accept that update when it also accounts for the current visible DOM membership.
            const visible = items.filter((item) => !item.classList.contains('jg-filtered'));
            unchanged = sameItems(controller.entries, visible);
          }
          if (unchanged) {
            justifiedItems.set(controller, { items, entries: controller.entries });
            return;
          }
        }
        // 3.8.1's entry point refreshes changed entries on the same controller.
        // Its init starts a width timer without clearing the old one.
        if (controller) window.clearInterval(controller.checkWidthIntervalId);
        $gallery.justifiedGallery();
        const updated = $gallery.data('jg.controller');
        // Randomize/sort can change DOM order during refresh. Remember the resulting full order.
        justifiedItems.set(updated, { items: updated.getAllEntries(), entries: updated.entries });
      });
    }
  }

  function prune() {
    requests.forEach((options, root) => {
      if (root !== document && !root.isConnected) requests.delete(root);
    });
  }

  function retry() {
    prune();
    requests.forEach((options, root) => apply(root, options));
  }

  window.HexoGallery = {
    /**
     * Enhance images in a content container, optionally initializing the two Gallery SDKs.
     * Repeated calls reuse existing wrappers, captions and plugin instances. Missing SDKs can be
     * retried by calling init again; DOM ready, window load and subsequent script loads also retry
     * connected containers with their latest options. SDK initialization waits for DOM readiness.
     * Changed item collections refresh their existing SDK instance; disabled flags do not tear it
     * down. An unchanged pre-existing third-party instance is reused without rebinding.
     * @param {Document|Element} [root=document] Content container; document targets .article images
     *     and lightboxes, and all .justified-gallery elements.
     * @param {Object} [options={}] SDK opt-ins; omitted flags disable plugin initialization.
     * @param {boolean} [options.lightGallery=false] Initialize lightGallery when available.
     * @param {boolean} [options.justifiedGallery=false] Initialize justifiedGallery when available.
     */
    init: function (root, options) {
      root = root || document;
      options = options || {};
      const enabled = {
        lightGallery: options.lightGallery === true,
        justifiedGallery: options.justifiedGallery === true,
      };
      prune();
      requests.set(root, enabled);
      apply(root, enabled);
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', retry, { once: true });
  }
  if (document.readyState !== 'complete') window.addEventListener('load', retry, { once: true });
  // Deferred scripts may arrive after init, including on the first enabled page reached by PJAX.
  // Retry the latest requests, rather than capturing a previous page's enabled configuration.
  document.addEventListener(
    'load',
    (event) => {
      if (event.target.tagName === 'SCRIPT') retry();
    },
    true,
  );
}

module.exports = '(' + installGallery.toString() + ')(window);';
