/* eslint-env browser */
/**
 * Consent boundary for the theme's explicitly classified analytics integrations.
 * @module util/consent
 */
const { toJs } = require('./script');

// Kept self-contained because this function is emitted into the generated page.
function installConsent(type) {
  if (window.hexoComponentConsent) {
    return;
  }
  const integrations = Object.create(null);
  let started = false;
  const status = (document.cookie.match(/(?:^|;\s*)cookieconsent_status=([^;]*)/) || [])[1];
  let allowed = type === 'opt-out' ? status !== 'deny' : status === 'allow';
  let popup = null;
  function run() {
    Object.keys(integrations).forEach((id) => {
      const integration = integrations[id];
      if (allowed && !integration.started) {
        integration.started = true;
        started = true;
        integration.start();
      }
    });
  }
  window.hexoComponentConsent = {
    allowed: function () {
      return allowed;
    },
    register: function (id, start, stop) {
      if (!integrations[id]) {
        integrations[id] = { start: start, stop: stop, started: false };
      }
      run();
    },
    setPopup: function (value) {
      popup = value;
    },
    setStatus: function (value) {
      const previous = allowed;
      allowed = type === 'opt-out' ? value !== 'deny' : value === 'allow';
      if (previous && !allowed) {
        try {
          Object.keys(integrations).forEach((id) => {
            const integration = integrations[id];
            if (integration.started && integration.stop) {
              integration.stop();
            }
          });
        } finally {
          // A loaded vendor SDK may own timers/listeners that cannot safely be unloaded.
          // A new document, with the saved denial, is the generic stop boundary.
          if (started) {
            window.location.reload();
          }
        }
      } else {
        run();
      }
    },
    revoke: function () {
      if (popup) {
        popup.setStatus('deny');
      } else {
        document.cookie = 'cookieconsent_status=deny; Path=/; Max-Age=31536000; SameSite=Lax';
      }
      // setStatus on the popup invokes this too; a repeated denial is harmless.
      this.setStatus('deny');
    },
    open: function () {
      if (popup) {
        popup.open();
      }
    },
  };
}

/**
 * Build the idempotent browser-side consent controller. Info is deliberately not gated.
 * @param {string} type CookieConsent mode.
 * @returns {string} Inline JavaScript.
 */
function consentRuntime(type) {
  return `(${installConsent.toString()})(${toJs(type)});`;
}

/**
 * Defer all scripts (including inline SDK bootstrap code) until this integration is authorized.
 * Noscript pixels are intentionally not restored: without JavaScript consent cannot be obtained.
 * @param {string} id Stable integration ID, shared across PJAX navigations.
 * @param {string} markup Rendered integration markup containing scripts.
 * @param {string} type CookieConsent mode.
 * @returns {string} Inline JavaScript without active external resources before permission.
 */
function gateMarkup(id, markup, type) {
  return `${consentRuntime(type)}
    window.hexoComponentConsent.register(${toJs(id)}, function () {
      var template = document.createElement('template');
      template.innerHTML = ${toJs(markup)};
      template.content.querySelectorAll('script').forEach(function (source) {
        if (!window.hexoComponentConsent.allowed()) return;
        var script = document.createElement('script');
        Array.prototype.forEach.call(source.attributes, function (attr) {
          script.setAttribute(attr.name, attr.value);
        });
        script.textContent = source.textContent;
        document.head.appendChild(script);
      });
    });`;
}

module.exports = { consentRuntime, gateMarkup };
