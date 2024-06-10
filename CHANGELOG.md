# Version 3
- Adds support for GNOME 42 and 43

# Version 4
Adds 3 new options:
- Remove text when paused
- Delay for "Remove text when paused" option
- Switch to the most recent source automatically

Aditionally:
- A few minor bugs fixed
- A few warnings cleared

# Version 7
- Adds source icon alongside the label as an option
- Big performance improvements
- Prevents shell slowdowns or freezes when players respond slowly to D-Bus calls

# Version 10
- Fixes for GNOME 3.3x

# Version 12
- Fixes issues with the panel position being "stolen" by other extensions
- Adds filters to allow/disallow specified mpris sources
- Adds tooltips(hints) for various options

# Version 13
- Adds support for GNOME 44
- Adds a menu for player selection
- Improves filtering
- Increases the chance of finding the application icon
- Adds bindable mouse controls
- Improves performance (refresh time down from 5-9ms to 1ms or less)

# Version 14
- Action 'open app' will focus to the last window/workspace if the focused
  window is the player window
- Action 'play/pause' will send a 'Stop' signal to the player if the player is
  active and 'Pause' isn't available

# Version 15
- Merges the scroll up/down actions and makes them optional

# Version 16
- Changes the 'Remove remaster text' option for a user-definable list of
  strings that trigger the filter

# Version 17
Includes new options to customize the icon alongside the label:
- Icon padding: adjust the distance between the label text and icon
- Use symbolic icon: Use the simplified, monochromatic version of the app icon
- Use album art as icon when available
- Album art scaling: adjust the size of the album art image on the panel

# Version 18
- Hide the label widget completely when there's no available mpris sources
- Uncouple refresh from shell main loop (this virtually gives the extension a
  "refresh time" of 0ms)
- Allow smaller sizes of album art (the minimum scale is now 20%)

# Version 23
- Allows binding of two actions per button, for single and double click
- Uses Adwaita for the preferences window
- Removes support for GNOME 3.36, 3.38, 40, 41, and 42
  (The extension may still work in GNOME 42 but it's untested)

# Version 25
- Uses Adwaita extensively, giving a polished and up-to-date look to the
  preferences window
- Adds 'individual' reset buttons for every settings row

# Version 27 (v28 for GNOME 45)
- Solves various problems triggered by an empty `Identity` field on a player
- Allows binding the action 'Next/Prev track' to scroll up/down
- Allows different font colors for the label text  
Note: The unlisted version 26 for GNOME 45 users already included the `Identity` fixes

# Version 29 (v30 for GNOME 45/46)
- Adds support for GNOME 46
- Prevents shell crashes when changing the extension position in the panel

# Version 31 (v32 for GNOME 45/46)
- Captures UP/DOWN scroll signals, fixing a regression experienced by GNOME 46
  users
- Replaces the "info-symbolic" icon with an standard icon (v32 only)

