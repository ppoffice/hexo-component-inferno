const vm = require('vm');
const { JSDOM } = require('jsdom');
const { consentRuntime, gateMarkup } = require('./consent');
const { createElement } = require('inferno-create-element');
const { renderToStaticMarkup } = require('inferno-server');
const Matomo = require('../view/plugin/matomo');

describe('analytics consent boundary', () => {
  let dom, context, api;

  function install(type, status) {
    dom = new JSDOM('<!doctype html>', { url: 'https://example.com/' });
    if (status) dom.window.document.cookie = `cookieconsent_status=${status}; Path=/`;
    const window = { location: { reload: jest.fn() } };
    context = vm.createContext({ window, document: dom.window.document });
    vm.runInContext(consentRuntime(type), context);
    api = window.hexoComponentConsent;
  }

  afterEach(() => dom.window.close());

  test.each([undefined, 'dismiss', 'deny', 'invalid'])('opt-in blocks status %s', (status) => {
    install('opt-in', status);
    const start = jest.fn();
    api.register('tracker', start);
    expect(start).not.toHaveBeenCalled();
    api.setStatus('allow');
    expect(start).toHaveBeenCalledTimes(1);
    api.register('tracker', start);
    vm.runInContext(consentRuntime('opt-in'), context);
    expect(context.window.hexoComponentConsent).toBe(api);
    expect(start).toHaveBeenCalledTimes(1);
  });

  test.each(['opt-in', 'opt-out'])('restores explicit allow for %s', (type) => {
    install(type, 'allow');
    const start = jest.fn();
    api.register('tracker', start);
    expect(start).toHaveBeenCalledTimes(1);
  });

  test.each([undefined, 'dismiss', 'allow'])('opt-out allows status %s', (status) => {
    install('opt-out', status);
    const start = jest.fn();
    api.register('tracker', start);
    expect(start).toHaveBeenCalledTimes(1);
  });

  test('saved opt-out denial blocks loading, including after withdrawal and a new document', () => {
    install('opt-out', 'deny');
    const start = jest.fn();
    api.register('tracker', start);
    expect(start).not.toHaveBeenCalled();
    api.revoke();
    expect(dom.window.document.cookie).toContain('cookieconsent_status=deny');
    expect(context.window.location.reload).not.toHaveBeenCalled();
  });

  test('withdrawal stops future registrations, invokes cleanup, and reloads the SDK context once', () => {
    install('opt-in', 'allow');
    const stop = jest.fn();
    api.register('tracker', jest.fn(), stop);
    api.revoke();
    api.revoke();
    const future = jest.fn();
    api.register('future', future);
    expect(api.allowed()).toBe(false);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(future).not.toHaveBeenCalled();
    expect(context.window.location.reload).toHaveBeenCalledTimes(1);
    expect(dom.window.document.cookie).toContain('cookieconsent_status=deny');
  });

  test('cleanup failures cannot prevent the withdrawal reload boundary', () => {
    install('opt-in', 'allow');
    api.register('custom', jest.fn(), () => { throw new Error('vendor cleanup failed'); });
    expect(() => api.revoke()).toThrow('vendor cleanup failed');
    expect(api.allowed()).toBe(false);
    expect(context.window.location.reload).toHaveBeenCalledTimes(1);
    expect(dom.window.document.cookie).toContain('cookieconsent_status=deny');
  });

  test('Matomo initializes at the current PJAX page only after allow, and denial blocks a fresh document', () => {
    install('opt-in');
    const markup = renderToStaticMarkup(createElement(Matomo, {
      url: 'https://matomo.example/', siteId: '1',
    }));
    const code = gateMarkup('matomo', markup, 'opt-in');
    // Execute restored inline scripts as a browser would, but never load a network resource.
    const append = dom.window.document.head.appendChild.bind(dom.window.document.head);
    dom.window.document.head.appendChild = (script) => {
      append(script);
      if (!script.src) vm.runInContext(script.textContent, context);
      return script;
    };
    context.location = dom.window.location;
    vm.runInContext(code, context);
    dom.window.history.pushState(null, '', '/before-allow/');
    dom.window.document.dispatchEvent(new dom.window.Event('pjax:complete'));
    expect(context.window._paq).toBeUndefined();
    expect(dom.window.document.querySelectorAll('script[src]')).toHaveLength(0);
    api.setStatus('allow');
    expect(context.window._paq.filter((entry) => entry[0] === 'trackPageView')).toHaveLength(1);
    expect(dom.window.document.querySelector('script[src]').src).toBe('https://matomo.example/matomo.js');
    dom.window.history.pushState(null, '', '/after-allow/');
    dom.window.document.dispatchEvent(new dom.window.Event('pjax:complete'));
    expect(context.window._paq).toContainEqual(['setCustomUrl', 'https://example.com/after-allow/']);
    expect(context.window._paq.filter((entry) => entry[0] === 'trackPageView')).toHaveLength(2);
    api.revoke();
    expect(context.window.location.reload).toHaveBeenCalledTimes(1);
    dom.window.close();
    install('opt-in', 'deny');
    vm.runInContext(code, context);
    dom.window.document.dispatchEvent(new dom.window.Event('pjax:complete'));
    expect(context.window._paq).toBeUndefined();
    expect(dom.window.document.querySelectorAll('script[src]')).toHaveLength(0);
  });

  test('scripts and noscript pixels remain inert until allow; attributes and inline order survive', () => {
    install('opt-in');
    const markup = '<script>window.queue = [];</script>' +
      '<script src="https://tracker.example/sdk.js" data-id="42" defer></script>' +
      '<noscript><img src="https://tracker.example/pixel"></noscript>';
    const code = gateMarkup('tracker', markup, 'opt-in');
    expect(code).not.toContain('</script>');
    vm.runInContext(code, context);
    expect(dom.window.document.querySelectorAll('[src]')).toHaveLength(0);
    api.setStatus('allow');
    const scripts = dom.window.document.querySelectorAll('script');
    expect(scripts).toHaveLength(2);
    expect(scripts[0].textContent).toBe('window.queue = [];');
    expect(scripts[1].getAttribute('src')).toBe('https://tracker.example/sdk.js');
    expect(scripts[1].getAttribute('data-id')).toBe('42');
    expect(scripts[1].hasAttribute('defer')).toBe(true);
    expect(dom.window.document.querySelector('img')).toBe(null);
    vm.runInContext(code, context);
    expect(dom.window.document.querySelectorAll('script')).toHaveLength(2);
  });
});
