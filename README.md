# furios-firefox-tweaks

Mobile and privacy friendly configuration for current standard and extended
support releases of Firefox.

## What this config does

* Adapt UI elements and "about:" pages to small screen sizes (when opened on
  small screen)
* Enable mobile gestures
* Uncluttering:
  * Disable built-in advertisements (e.g. hardcoded links for certain social
    media sites on the start page)
  * Disable "User Messaging" about new features etc.

## For users: making changes

As user, it is possible to override all options set by this project. Usually it
can be done in the preferences (which are now adaptive, so you can actually use
them on your phone).

If it cannot be changed in preferences, look in
`/etc/firefox/policies/policies.json`. You can see the active policies while
Firefox is running in `about:policies`. The uBlock origin add-on for example,
is getting installed through `policies.json` and can be removed in that file
if you do not want it. Without editing the file, it can only be disabled in the
add-on settings, and not removed, this is a limitation of `policies.json`.

Feel free to
[create an issue](https://github.com/FuriLabs/furios-firefox-tweaks/issues?q=sort%3Aupdated-desc+is%3Aissue+is%3Aopen)
if you run into problems. Or even better, attempt to fix the problem yourself
(see development instructions below) and submit a
[pull request](https://github.com/FuriLabs/furios-firefox-tweaks/pulls?q=sort%3Aupdated-desc+is%3Apr+is%3Aopen).

## Contributing changes to userChrome
Firefox' developer tools include a
[remote debugger](https://developer.mozilla.org/en-US/docs/Tools/Remote_Debugging),
which even has the "pick an element" feature. You will be able to click that
button on your PC, then tap on an element of the Firefox UI on your phone, and
then you will see the HTML code and CSS properties on your PC just as if it was
a website. So this is highly recommended when contributing changes to
`userChrome.css`.

* Connect your phone and your PC to the same network (Wi-Fi or USB network)
* On your phone, open Firefox and `about:config`:
  * Change `devtools.chrome.enabled` to `true`
  * Change `devtools.debugger.remote-enabled` to `true`
  * The debugger will only listen on localhost by default. If you know what you
    are doing, you may set `devtools.debugger.force-local` to `false`, so it
    listens on all interfaces. Otherwise you'll need something like an SSH
    tunnel.
  * Close firefox
  * Set up environment variables properly, so you can start programs (one lazy
    way to do it, is `tmux` on your phone in the terminal, then `tmux a` in
    SSH)
  * Run `firefox --start-debugger-server 6000` (or another port if you desire)
* Run Firefox on your PC
  * Go to `about:debugging`
  * Add your phone as "network location" (`10.15.19.82:6000` if connected through USB Network)
  * Press the connect button on the left
* On your phone
  * Confirm the connection on your phone's screen
    * If the button is not visible on the screen, try switching to a terminal
      virtual keyboard, hit "tab" three times and then return
* On your PC
  * Scroll down to Processes, Main Process, and click "Inspect"
  * Now use the "Pick an element" button as described in the introduction. Find
    the `userChrome.css` file in the "Style editor" tab and edit it as you
    like.
  * Consider copy pasting the contents to a text editor every now and then, so
    you don't lose it when closing Firefox by accident.

Note that after making changes to CSS files, and deploying them on your
system (`make install`), you might need to restart firefox _twice_ before
changes are applied.

## Log file

The `src/mobile-config-autoconfig.js` script generates `userChrome.css` and
`userContent.css` while Firefox starts. It logs to your Firefox profile
directory, follow the log file with:

```
$ tail -F $(find ~/.mozilla -name mobile-config-firefox.log)
```

## Coding guidelines

* Don't make longer lines than 79 columns where possible (like in PEP-8)
* Use 4 spaces for indent in all files, except for shell scripts (use tabs
  there). Consider configuring your editor to use `.editorconfig`, then it gets
  configured automatically.

## Additional resources
* [How to use the Firefox Browser Toolbox](https://developer.mozilla.org/en-US/docs/Tools/Browser_Toolbox)
* [firefox-csshacks](https://github.com/MrOtherGuy/firefox-csshacks/)
* [FirefoxCSS subreddit](https://www.reddit.com/r/FirefoxCSS/)
* [whattrainisitnow.com](https://whattrainisitnow.com/): FF and FF ESR releases
  currently supported upstream, we try to support these with this config
