{
    const PENDING_PREFS = []
    let PENDING_PREF_INTERVAL
    let recreatePrefFn

    function createPreferenceCheckbox( id, label, prefName, nextTo, invert, isRetry )
    {
        const nextToOrig =  document.getElementById( nextTo )
        const template = document.getElementById( "startupPageBox" )

        if ( !nextToOrig || !template )
        {
            if ( isRetry ) return false

            // We must be loading into a hash or something. Remember this for later.
            console.warn( "Couldn't find original element " + nextTo + ". Deferring creation of " + id + " checkbox." )
            PENDING_PREFS.push( [ id, label, prefName, nextTo, invert, true ] )

            if ( !PENDING_PREF_INTERVAL )
            {
                PENDING_PREF_INTERVAL = setInterval( recreatePrefFn, 20 )
            }

            return false
        }

        const baseRow = template.cloneNode( true )
        const check = baseRow.children[ 0 ]
        const pref = Preferences.add( { id: prefName, type: "bool" } )

        baseRow.id = id + "Box"
        check.id = id

        check.setAttribute( "data-l10n-id", "" ) // TODO: l10n
        check.setAttribute( "accesskey", "" )

        check.label = label
        check.checked = invert ? !pref.value : pref.value

        check.addEventListener( "CheckboxStateChange", function( e )
        {
            pref.value = invert ? !e.target.checked : e.target.checked
        } )

        document.getElementById( nextTo ).parentNode.appendChild( baseRow )
        return true
    }

    recreatePrefFn = function()
    {
        if ( PENDING_PREFS.length === 0 )
        {
            clearInterval( PENDING_PREF_INTERVAL )
            return
        }

        for ( let i = 0; i < PENDING_PREFS.length; i++ )
        {
            if ( createPreferenceCheckbox( ...PENDING_PREFS[ i ] ) )
            {
                PENDING_PREFS.splice( i, 1 )
                i--
            }
        }
    }

    // Search bar focus tweaks
    {
        const searchBar = document.getElementById( "searchInput" )

        document.addEventListener( "touchstart", function( e )
        {
            searchBar.className = searchBar.value.length > 0 ? "has-text" : ""
            if ( e.target !== searchBar ) searchBar.blur()
        } )

        searchBar.addEventListener( "input", function( e )
        {
            searchBar.className = searchBar.value.length > 0 ? "has-text" : ""
        } )
    }

    window.addEventListener( "load", function()
    {
        createPreferenceCheckbox( "preload", "Keep Firefox open in the background", "furi.browser.preload.disabled", "startupPageBox", true )
        createPreferenceCheckbox( "topTabs", "Display tab bar on the bottom of the screen", "furi.topTabs", "warnCloseMultiple", true )

        document.body.classList.add( "loaded" )
    } )
}
