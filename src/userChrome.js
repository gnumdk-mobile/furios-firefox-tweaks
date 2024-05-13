{
    window.fixPanel = function(panel, force)
    {
        if (panel.children.length == 0) return;

        const contentHeight = Array.from(panel.children).reduce(function(acc, el) { return acc + el.scrollHeight }, 0);
        const desiredY = panel.getPanelY ? panel.getPanelY() : document.documentElement.clientHeight - contentHeight - 104;

        if (panel.getAttribute("lastcomputedpos") == desiredY && !force) return;
        panel.setAttribute("lastcomputedpos", desiredY);

        try
        {
            panel.moveToAnchor(null, "before_start", 0, desiredY, true);
            panel.moveTo(0, desiredY);
        }
        catch (e)
        {
            console.error("Failed to fix panel", e);
        }
    }

    window.fixAllPanels = function()
    {
        for (const panel of document.querySelectorAll('panel')) {
            window.fixPanel(panel);
        }
    }

    // Enable `remote` on panels so APZ works. Somehow this also improves animation performance.
    // This probably should be fixed C++ side, but this is a quick hack that gets us there.
    const panelObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes'
                && (mutation.attributeName === 'panelopen'
                    || mutation.attributeName === 'remote'
                    || mutation.attributeName === 'type')) {
                // Don't mess with browser elements; we want about: pages to still be not remote.
                // If you set the remote attribute on a browser element that points to, say, about:config,
                // the behavior becomes very glitchy - tapping on the tab makes it go blank, etc.
                // Same goes for hbox. Ideally this would be a whitelist, but...
                if (mutation.target instanceof XULElement
                    && (mutation.target.localName === 'browser'
                        || mutation.target.localName === 'hbox')) {
                    continue;
                }

                // Unset the type attribute, as type="arrow" causes slower animation performance. (?)
                if (mutation.target.getAttribute('type') === 'arrow') {
                    mutation.target.removeAttribute('type');
                }

                if (mutation.target.getAttribute('remote') !== 'true') {
                    mutation.target.setAttribute('remote', 'true');
                    setTimeout(() => {
                        window.fixPanel(mutation.target, true);
                    }, 0);
                }

            }
            // Also whenever a new panel is created, set the remote attribute
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    // Unset the type attribute, as type="arrow" causes slower animation performance. (?)
                    if (mutation.target.getAttribute('type') === 'arrow') {
                        mutation.target.removeAttribute('type');
                    }

                    if (node instanceof XULElement && node.localName === 'panel') {
                        node.setAttribute('remote', true);
                        window.fixPanel(node, true);
                    }
                }
            }
        }

        window.fixAllPanels();
    });
    // Look for all panels that are already in the document and set the remote attribute
    for (const panel of document.querySelectorAll('panel')) {
        panel.setAttribute('remote', true);
    }

    panelObserver.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
    window['mobilePanelObserver'] = panelObserver;

    // Whenever the window is resized, ensure all panels are repositioned relative to the new size
    let previousHeight = window.innerHeight;
    const resizeObserver = new ResizeObserver(() => {
        if (window.innerHeight !== previousHeight) {
            window.fixAllPanels();
            previousHeight = window.innerHeight;
        }
    });

    resizeObserver.observe(document.documentElement);
}

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
