const { Component, Fragment } = require('inferno');
const { cacheComponent } = require('../../util/cache');

class Gallery extends Component {
    render() {
        const { head, lightGallery, justifiedGallery } = this.props;
        if (head) {
            return <Fragment>
                <link rel="stylesheet" href={lightGallery.cssUrl} />
                <link rel="stylesheet" href={justifiedGallery.cssUrl} />
            </Fragment>;
        }

        const js = `document.addEventListener('DOMContentLoaded', () => {
            if (typeof $.fn.lightGallery === 'function') {
                $('.article').lightGallery({ selector: '.gallery-item' });
            }
            if (typeof $.fn.justifiedGallery === 'function') {
                if ($('.justified-gallery > p > .gallery-item').length) {
                    $('.justified-gallery > p > .gallery-item').unwrap();
                }
                $('.justified-gallery').justifiedGallery();
            }
        });`;

        return <Fragment>
            <script src={lightGallery.jsUrl} defer={true}></script>
            <script src={justifiedGallery.jsUrl} defer={true}></script>
            <script dangerouslySetInnerHTML={{ __html: js }}></script>
        </Fragment>;
    }
}

module.exports = cacheComponent(Gallery, 'plugin.gallery', props => {
    const { head, helper } = props;
    return {
        head,
        lightGallery: {
            jsUrl: helper.cdn('lightgallery', '1.6.8', 'dist/js/lightgallery.min.js'),
            cssUrl: helper.cdn('lightgallery', '1.6.8', 'dist/css/lightgallery.min.css')
        },
        justifiedGallery: {
            jsUrl: helper.cdn('justifiedGallery', '3.7.0', 'dist/js/jquery.justifiedGallery.min.js'),
            cssUrl: helper.cdn('justifiedGallery', '3.7.0', 'dist/css/justifiedGallery.min.css')
        }
    };
});
