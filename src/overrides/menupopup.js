/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 "use strict";

 // This is loaded into all XUL windows. Wrap in a block to prevent
 // leaking to window scope.
 {
   const { AppConstants } = ChromeUtils.importESModule(
     "resource://gre/modules/AppConstants.sys.mjs"
   );

   document.addEventListener(
     "popupshowing",
     function (e) {
       // For the non-native context menu styling, we need to know if we need
       // a gutter for checkboxes. To do this, check whether there are any
       // radio/checkbox type menuitems in a menupopup when showing it.
       if (e.target.nodeName == "menupopup") {
         let haveCheckableChild = e.target.querySelector(
           `:scope > menuitem:not([hidden]):is([type=checkbox],[type=radio]${
             // On macOS, selected menuitems are checked regardless of type
             AppConstants.platform == "macosx"
               ? ",[checked=true],[selected=true]"
               : ""
           })`
         );
         e.target.toggleAttribute("needsgutter", haveCheckableChild);
       }
     },
     // we use a system bubbling event listener to ensure we run *after* the
     // "normal" popupshowing listeners, so (visibility) changes they make to
     // their items take effect first, before we check for checkable menuitems.
     { mozSystemGroup: true }
   );

   class MozMenuPopup extends MozElements.MozElementMixin(XULPopupElement) {
     constructor() {
       super();

       this.attachShadow({ mode: "open" });

       this.addEventListener("popupshowing", event => {
         if (event.target != this) {
           return;
         }

         // Make sure we generated shadow DOM to place menuitems into.
         this.ensureInitialized();

         this.setAttribute("flip", "slide");
         this.setAttribute("remote", (parseInt(this.getAttribute("remote")) || 0) + 1);

         var combinedWidth = Array.from(this.shadowRoot.children).reduce(
              (acc, child) => acc + child.scrollWidth,
              8
            );

        var combinedHeight = Array.from(this.shadowRoot.children).reduce(
              (acc, child) => acc + child.scrollHeight,
              8
            );

        this.sizeTo(combinedWidth, combinedHeight);
       });
     }

     connectedCallback() {
       if (this.delayConnectedCallback() || this.hasConnected) {
         return;
       }

       this.hasConnected = true;
     }

     ensureInitialized() {
       this.shadowRoot;
     }

     get shadowRoot() {
       if (!super.shadowRoot.firstChild) {
         // We generate shadow DOM lazily on popupshowing event to avoid extra
         // load on the system during browser startup.
         super.shadowRoot.appendChild(this.fragment);
       }
       return super.shadowRoot;
     }

     get fragment() {
       if (!this.constructor.hasOwnProperty("_fragment")) {
         this.constructor._fragment = MozXULElement.parseXULToFragment(
           this.markup
         );
       }
       return document.importNode(this.constructor._fragment, true);
     }

     get markup() {
       return `
         <html:link rel="stylesheet" href="chrome://global/skin/global.css"/>
         <box class="menupopup-arrowscrollbox"
                        part="arrowscrollbox content"
                        exportparts="scrollbox: arrowscrollbox-scrollbox"
                        flex="1"
                        orient="vertical">
           <html:slot></html:slot>
          </box>
       `;
     }
   }

   customElements.define("menupopup", MozMenuPopup);

   MozElements.MozMenuPopup = MozMenuPopup;
 }
