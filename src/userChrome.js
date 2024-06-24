{
    // We can't load file:// URIs from this context, but we can preload modules and patch them before they're used
    var HOOKS = {};
    HOOKS["resource:///modules/PanelMultiView.sys.mjs"] = function(module) {
        const PanelMultiView = module.PanelMultiView;
        PanelMultiView.prototype._calculateMaxHeight = function(event) {
            return document.documentElement.clientHeight - 100;
        }
    };

    if (window && window.ChromeUtils && !ChromeUtils.defineESModuleGetters_orig)
    {
        ChromeUtils.defineESModuleGetters_orig = ChromeUtils.defineESModuleGetters;
        ChromeUtils.defineESModuleGetters = function(target, properties) {
            for (var prop in properties) {
                if (HOOKS[properties[prop]]) {
                    HOOKS[properties[prop]](ChromeUtils.importESModule(properties[prop]));
                }
            }
            return ChromeUtils.defineESModuleGetters_orig(target, properties);
        }
    }
}

if (document)
{
    // When the user touches the browser, get stuff out of the way
    document.addEventListener('DOMContentLoaded', () => {
        const browser = document.getElementById('browser');
        if (!browser) {
            return;
        }

        browser.addEventListener('touchstart', () => {
            gURLBar.blur();
        }, { passive: true });

        const titleBar = document.getElementById('titlebar');
        if (titleBar) {
            titleBar.addEventListener('touchstart', () => {
                gURLBar.blur();
            }, { passive: true });
        }
    });
}
