{
    // Enable `remote` on panels so APZ works. This probably should be patched
    // C++ side, but this is a quick fix for now.
    const panelObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && (mutation.attributeName === 'panelopen' || mutation.attributeName === 'remote')) {
                if (mutation.target.getAttribute('remote') !== 'true') {
                    mutation.target.setAttribute('remote', 'true');
                }
            }
            // Also whenever a new panel is created, set the remote attribute
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node instanceof XULElement && node.localName === 'panel') {
                        node.setAttribute('remote', true);
                    }
                }
            }
        }
    });

    panelObserver.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
    window['mobilePanelObserver'] = panelObserver;

    // Look for all panels that are already in the document and set the remote attribute
    for (const panel of document.querySelectorAll('panel')) {
        panel.setAttribute('remote', true);
    }
}

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
    });
}
