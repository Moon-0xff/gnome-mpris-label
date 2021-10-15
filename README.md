[extension screenshot](./screenshot.png)

# About
This GNOME extension reads metadata information from an mpris compatible player and displays it on the top bar.

It works with Spotify, Vlc, Rhythmbox, Chromium based browsers and (probably) any mpris compatible player.

This was originally a fork of mheine's spotify-label. I've rewritten almost the entire original code and reverted almost every commit. So i decided to start this repository from scratch.

Warning: user options have not been implemented yet. If you want to change default values, you will have to edit the source code.

## To Do List
- [ ] Fix broken/messy label when artist or album field is empty
- [ ] Discard player source if there is no metadata to read (fixes a bug with Chromium)
- [ ] Change player source either by clicking the label or by a dropdown menu
- [ ] Implement user accessible settings

## Contribution

If you can tackle any missing feature or you encountered a bug and fixed it yourself feel free to submit a pull request. I'm more than happy to receive your help.
  
## Installation

- Clone this repository `git clone https://github.com/Moon-0xff/mpris-music-label.git`
- Rename it to `mprisLabel@moon-0xff.github.com`
- Move it to your gnome-shell extensions folder. Default path is `~/.local/share/gnome-shell/extensions/`
- Restart GNOME and it should be enabled by default, check tweaks or extensions if it's not
