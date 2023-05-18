# Scope
This is a short guide about editing the source code of [this
extension](https://github.com/Moon-0xff/gnome-mpris-label/)

This is not a guide about GJS or creating new GNOME extensions.

# Prerequisites
* General programming knowledge
* Basic `git` usage knowledge
* Basic terminal usage knowledge

# Preparing a working space
* Clone the repository to any place outside the installation directory

Extension updates will overwrite your changes if you write them directly to the
installation directory

* Change your GNOME session from GNOME(Wayland) To GNOME Xorg

This gives you the ability of restarting your gnome session by running the `r`
command through GNOME's command prompt (shortcut `Alt+F2, r`)

# Understanding the source code
## The label.js file:
Most people will probably want to edit this file, it stores all
the code that builds the string displayed on the top panel.

If your changes to this file require information from the player (e.g know if
the player is paused or not) you will need to read the `players.js` file, or at
least the description coming up next.

## The players.js file:
This file declares two classes: `Players` and `Player` (don't confuse them!)

The `Players` class manages the list of players (`players.list`), and the
selected player (`players.selected`)

The `Player` class is the interface between MPRIS and our code, reading
the class definition should be enough to learn how to interface with it.  
To learn how to expand or edit this class it might be
necessary to read the MPRIS specification and the gjs guide about the D-Bus
Proxy object.

The main reference for the entire file is GNOME's `mpris.js`

## The extension.js file:
This file houses all the code that interfaces with gnome-shell, among other
things.

This file is better explained by gjs.guide, the PRs that introduced the various
features, the commit log, and the source code itself. (Sorry about that).

## The pref.js file:
This file is part of the standard extension structure an houses all the code that relates to the Prefences dialog and links to gsettings. See [GJS guide](https://gjs.guide/extensions/development/preferences.html#creating-the-schema) for details. Note that this files does not use the latest Adwaita style or functions for backward compatibility with older Gnome Shell versions.

## Coding style
We loosely follow [gnome's coding style](https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/HACKING.md) except for two points:

1. We use tabs for indentation
2. Lines of code don't follow a strict length limit

We also use `SCREAMING_SNAKE_CASE` for option variables, as they were originally
constants (in some files they still are)

## Documentation:
* [Gnome's official GJS guides](https://gjs.guide/)
* [GJS official documentation](https://gjs-docs.gnome.org/)
* [Mozilla's JavaScript guides and documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
* [GNOME's mpris.js file](https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/mpris.js)
* [The MPRIS specification](https://specifications.freedesktop.org/mpris-spec/latest/Media_Player.html)
* Our [commit log](https://github.com/Moon-0xff/gnome-mpris-label/commits/main), [PRs](https://github.com/Moon-0xff/gnome-mpris-label/pulls?q=is%3Apr+is%3Aclosed) and [answered issues](https://github.com/Moon-0xff/gnome-mpris-label/issues?q=is%3Aissue+is%3Aclosed)

# Making changes to the source code
With all the above information, and aided by the documentation you should be
able to understand the source code and hopefully introduce your changes to it.

After adding your changes to the source code test your changes by installing the
modified version `$ ./install.sh` and restarting the shell for the changes to take effect:
* If using X11, you can restart the Gnome shell by typing `Alt+F2, r`
* If using Wayland, you will need to log out and log back in

Note that if you do a fork of an older version of the code and your revision has a lower revision number in `metadata.json` than the one in EGO, it will get overwritten in the background.

If you are having problems understanding the code or adding your changes please
raise an issue!

# Sharing your changes
After successfully making your changes, if you think they are worthy of being
shared please submit a PR!

As the readme states, you are free to request a merge for anything you want
added to this repo, however deciding where to accept them or not is a
matter of **cost vs benefit**.
