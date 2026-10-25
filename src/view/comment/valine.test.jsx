const { renderToString } = require('inferno-server');
const Valine = require('./valine');

test.each([
  [{}, {}, ['en', 'zh-CN'], 'en'],
  [{}, { lang: 'zh-CN' }, ['en'], 'zh-CN'],
  [{ lang: 'ja' }, { lang: 'zh-CN' }, ['en'], 'ja'],
])(
  'loads Valine 1.5.3 and preserves language precedence (%j, %j)',
  (comment, page, language, expected) => {
    const cdn = jest.fn(() => '/valine.js');
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const html = renderToString(
        <Valine.Cacheable
          comment={{ app_id: 'fixture-app', app_key: 'fixture-key', ...comment }}
          page={page}
          config={{ language }}
          helper={{ cdn }}
        />,
      );
      expect(cdn).toHaveBeenCalledWith('valine', '1.5.3', 'dist/Valine.min.js');
      expect(html).toContain(`lang: "${expected}"`);
      expect(html).toContain('visitor: false');
      expect(html).toContain('recordIP: false');
    } finally {
      warn.mockRestore();
    }
  },
);
