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

# Upcoming Version
- Add album art
