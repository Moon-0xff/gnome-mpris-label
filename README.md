![alt text](https://github.com/Moon-0xff/gnome-mpris-label/raw/main/screenshot.png "extension screenshot")

# About
This GNOME extension reads metadata information from an mpris compatible player and displays it on the top bar.

It works with Spotify, Vlc, Rhythmbox, Chromium based browsers and (probably) any mpris compatible player.

This was originally a fork of mheine's spotify-label. I've rewritten almost the entire original code and reverted almost every commit. So i decided to start this repository from scratch.

[Now avaliable at extensions.gnome.org](https://extensions.gnome.org/extension/4928/mpris-label)

## Contribution

Feel free to submit an issue if you have encountered a bug, want to ask something, want to share an idea for a feature, or something else entirely.

Feel free to submit a pull request for a bug you squashed, a feature you added, or anything you want merged to this repo.

Down below there's a list of stuff you can help me with, I'm not actively working in any of them (unless stated) so any contribution it's a great contribution.

## To do List / Help Wanted

- Add a user definable filter list (regex) for mpris sources
- Add an option to select active player by a dropdown menu
- Add an option to pause a player by clicking the label when no other mpris player is avaliable
- Make this extension refresh asynchronously

## Manual Installation
Note: you can also [install it from extensions.gnome.org](https://extensions.gnome.org/extension/4928/mpris-label) with just one click. If this is your first time installing an extension perhaps you don't have the necessary software to do it though. Visit the page for further instructions

- Clone this repository `$ git clone https://github.com/Moon-0xff/gnome-mpris-label.git`
- Rename it to `mprisLabel@moon-0xff.github.com`
- Move it to your gnome-shell extensions folder. Default path is `~/.local/share/gnome-shell/extensions/`
- Restart GNOME and it should be enabled by default, check tweaks or extensions if it's not

