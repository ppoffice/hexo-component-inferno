/* eslint-env browser */
const { renderToStaticMarkup } = require('inferno-server');
const CookieConsent = require('./cookie_consent');

describe('CookieConsent callbacks', () => {
  const helper = { __: (key) => key, cdn: (name, version, file) => `/cdn/${file}` };
  let options, popup;

  function run(type) {
    const container = document.createElement('div');
    container.innerHTML = renderToStaticMarkup(
      <CookieConsent.Cacheable head={false} plugin={{ type }} helper={helper} />,
    );
    // eslint-disable-next-line no-new-func
    new Function(container.querySelector('script').textContent)();
  }

  beforeEach(() => {
    document.head.innerHTML = '<script src="/cdn/build/cookieconsent.min.js"></script>';
    delete window.hexoComponentConsent;
    delete window.hexoComponentCookieConsentPopup;
    document.cookie = 'cookieconsent_status=; Max-Age=0; Path=/';
    popup = { setStatus: jest.fn(), open: jest.fn() };
    window.cookieconsent = {
      initialise: jest.fn((value, done) => {
        options = value;
        done(popup);
      }),
    };
  });

  test('info remains a notice without gating or withdrawal side effects', () => {
    run('info');
    expect(window.hexoComponentConsent).toBeUndefined();
    expect(options.type).toBe('info');
    expect(options.onStatusChange).toBeUndefined();
    expect(options.onRevokeChoice).toBeUndefined();
  });

  test('initializes after load too, initializes once under PJAX, and wires allow/deny', () => {
    run('opt-in');
    run('opt-in');
    expect(window.cookieconsent.initialise).toHaveBeenCalledTimes(1);
    expect(window.hexoComponentConsent.allowed()).toBe(false);
    options.onStatusChange('dismiss');
    expect(window.hexoComponentConsent.allowed()).toBe(false);
    options.onStatusChange('allow');
    expect(window.hexoComponentConsent.allowed()).toBe(true);
    options.onStatusChange('deny');
    expect(window.hexoComponentConsent.allowed()).toBe(false);
    window.hexoComponentConsent.open();
    expect(popup.open).toHaveBeenCalledTimes(1);
    options.onRevokeChoice.call(popup);
    expect(popup.setStatus).toHaveBeenCalledWith('deny');
    expect(options.revokeBtn).toContain('<button');
  });

  test('keeps consent UI CDN failures fail-closed for opt-in', () => {
    document.head.innerHTML = '';
    run('opt-in');
    expect(window.cookieconsent.initialise).not.toHaveBeenCalled();
    // Tracker gates install independently, before the UI library is available.
    expect(window.hexoComponentConsent).toBeUndefined();
    const script = document.head.querySelector('script');
    expect(script.src).toContain('/cdn/build/cookieconsent.min.js');
    script.dispatchEvent(new Event('error'));
    expect(document.head.querySelector('script')).toBe(null);
  });
});
