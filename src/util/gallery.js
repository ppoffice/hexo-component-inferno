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
  const lightboxes = new Map();

  function destroyLightbox(container) {
    const state = lightboxes.get(container);
    if (!state) return;
    container.removeEventListener('click', state.click);
    // The SDK removes its container through parentNode, even after a host replaced the body.
    const dialog = state.instance.$container && state.instance.$container.get();
    if (dialog && !dialog.parentNode) {
      dialog.style.display = 'none';
      document.body.appendChild(dialog);
    }
    if (state.instance.lgOpened) {
      state.instance.settings.startAnimationDuration = 0;
      state.instance.settings.backdropDuration = 0;
    }
    state.instance.destroy();
    lightboxes.delete(container);
  }

  function lightbox(container, enabled) {
    if (!enabled) {
      destroyLightbox(container);
      return;
    }
    if (typeof window.lightGallery !== 'function') return;
    const plugins = (window.HexoGallery.lightGalleryPlugins || []).map((name) => window[name]);
    if (plugins.some((plugin) => typeof plugin !== 'function')) return;
    const items = Array.from(container.querySelectorAll('a.gallery-item[href]'));
    if (!items.length) {
      destroyLightbox(container);
      return;
    }
    const elements = items.map((link) => {
      const image = link.querySelector('img');
      const caption = document.createElement('span');
      caption.textContent = image ? image.alt : '';
      return {
        src: link.href,
        thumb: image ? image.currentSrc || image.src : link.href,
        subHtml: caption.innerHTML,
        alt: caption.innerHTML.replace(/"/g, '&quot;'),
      };
    });
    const signature = JSON.stringify(elements);
    let state = lightboxes.get(container);
    if (state) {
      if (!sameItems(state.items, items) || state.signature !== signature) {
        if (state.instance.lgOpened) {
          state.instance.updateSlides(
            elements,
            Math.min(state.instance.index, elements.length - 1),
          );
        } else {
          state.instance.refresh(elements);
        }
        state.items = items;
        state.signature = signature;
      }
      return;
    }
    const instance = window.lightGallery(container, {
      dynamic: true,
      dynamicEl: elements,
      plugins,
    });
    state = { instance, items, signature, click: null };
    state.click = (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = event.target.closest('a.gallery-item');
      const index = state.items.indexOf(link);
      if (index < 0) return;
      event.preventDefault();
      instance.openGallery(index, link);
    };
    container.addEventListener('click', state.click);
    lightboxes.set(container, state);
  }

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
    // Do not capture an incomplete article while HTML is still being parsed.
    if (document.readyState === 'loading') return;
    containers.forEach((container) => lightbox(container, options.lightGallery));
    const $ = window.jQuery || window.$;
    if (!$ || !$.fn) return;
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
    lightboxes.forEach((state, container) => {
      if (!container.isConnected) destroyLightbox(container);
    });
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
     * Changed item collections refresh their existing SDK instance. Disabling the lightbox destroys
     * it; the independently managed layout plugin is unchanged.
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
    /** Destroy lightboxes and pending retries before a content root is replaced (e.g. PJAX). */
    destroy: function (root) {
      root = root || document;
      lightboxes.forEach((state, container) => {
        if (root === document || root === container || root.contains(container))
          destroyLightbox(container);
      });
      requests.forEach((options, target) => {
        if (root === document || root === target || root.contains(target)) requests.delete(target);
      });
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
