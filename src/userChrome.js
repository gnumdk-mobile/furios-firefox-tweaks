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

// Load JS into tabs. Used to deeply customize about: pages etc
{
   var INJECT_JS = {};
   INJECT_JS["about:preferences"] = "file:///usr/share/furios-firefox-tweaks/overrides/pages/preferences.js";

   const tryInject = function(target) {
       const baseUri = target.baseURI;
       if (baseUri !== target.location.href) return;

       const uri = new URL(baseUri);
       const cleanString = uri.protocol + uri.hostname + uri.pathname;

       if (INJECT_JS[cleanString]) {
           const innerDoc = target.documentElement.parentNode;   // ??? documentElement should be the root node
                                                                 // so wtf is parentNode in this case?
           const script = innerDoc.createElement('script');
           script.src = INJECT_JS[cleanString];
           innerDoc.head.appendChild(script);
       }
   }

   document.addEventListener('DOMWindowCreated', function(event) {
       const target = event.target;

       if (target instanceof HTMLDocument) {
           tryInject(target);
       }

       // Also watch for navigation events
       const window = event.target.defaultView;
       if (window) {
           window.addEventListener('DOMContentLoaded', function(e) {
               tryInject(window.document);
           });
       }
   });
}
