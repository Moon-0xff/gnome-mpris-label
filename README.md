![alt text](https://github.com/Moon-0xff/gnome-mpris-label/raw/main/screenshot.png "extension screenshot")

# About
This GNOME extension reads metadata information from an mpris compatible player and displays it on the top bar.

It works with Spotify, Vlc, Rhythmbox, Chromium based browsers and (probably) any mpris compatible player.

This was originally a fork of mheine's spotify-label. I've rewritten almost the entire original code and reverted almost every commit. So i decided to start this repository from scratch.

[Now avaliable at extensions.gnome.org](https://extensions.gnome.org/extension/4928/mpris-label)

## To Do List
- [X] Fix broken/messy label when artist or album field is empty
- [X] Change player source either by clicking the label or by a dropdown menu
- [X] Implement user accessible settings
- [X] Test GNOME 40/41 compatibility
- [X] Add option: Choose visible metadata fields and order
- [X] Submit extension to `extensions.gnome.org`

## Contribution

If you can tackle any missing feature or you encountered a bug and fixed it yourself feel free to submit a pull request. I'm more than happy to receive your help.

## Manual Installation
Note: you can also [install it from extensions.gnome.org](https://extensions.gnome.org/extension/4928/mpris-label) with just one click. If this is your first time installing an extension perhaps you don't have the necessary software to do it though. Visit the page for further instructions

- Clone this repository `$ git clone https://github.com/Moon-0xff/gnome-mpris-label.git`
- Rename it to `mprisLabel@moon-0xff.github.com`
- Move it to your gnome-shell extensions folder. Default path is `~/.local/share/gnome-shell/extensions/`
- Restart GNOME and it should be enabled by default, check tweaks or extensions if it's not
