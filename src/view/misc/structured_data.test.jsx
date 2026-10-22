/* eslint-env browser */
const { renderToString } = require('inferno-server');
const StructuredData = require('./structured_data');

test('A title cannot end the JSON-LD script', () => {
  const title = 'Why </script><img src=x onerror=alert(1)> breaks';
  const container = document.createElement('div');
  container.innerHTML = renderToString(
    <StructuredData
      title={title}
      url="https://example.com/post/"
      author="Author"
      description="Description"
      images={['/image.png']}
      date={new Date(0)}
      updated={new Date(0)}
    />,
  );
  expect(container.querySelector('img')).toBe(null);
  const scripts = container.querySelectorAll('script');
  expect(scripts.length).toBe(1);
  expect(JSON.parse(scripts[0].textContent).headline).toBe(title);
});
