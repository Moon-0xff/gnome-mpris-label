![alt text](https://github.com/Moon-0xff/gnome-mpris-label/raw/main/screenshot.png "extension screenshot")

# About
This GNOME extension reads metadata information from an mpris compatible player and displays it on the top bar.

It works with Spotify, Vlc, Rhythmbox, Chromium based browsers and (probably) any mpris compatible player.

This was originally a fork of mheine's spotify-label. I've rewritten almost the entire original code and reverted almost every commit. So i decided to start this repository from scratch.

## Installation

### One click installation from extensions.gnome.org

[Install this extension in one click from extensions.gnome.org](https://extensions.gnome.org/extension/4928/mpris-label)

If this is your first time installing an extension perhaps you don't have the necessary software to do it though. Visit the page for further instructions

### Using Git
* Install the stable release with:  
    `$ git clone https://github.com/Moon-0xff/gnome-mpris-label.git -b stable ~/.local/share/gnome-shell/extensions/mprisLabel@moon-0xff.github.com`

* Install the latest development version with:  
    `$ git clone https://github.com/Moon-0xff/gnome-mpris-label.git ~/.local/share/gnome-shell/extensions/mprisLabel@moon-0xff.github.com`  
    **Warning:** the latest development version could be broken or buggy

* Finally log out from GNOME and log in again. It should be enabled by default, check tweaks or extensions if it's not.

### Using Git and the installation script
1. Clone this repository: `$ git clone https://github.com/Moon-0xff/gnome-mpris-label.git`
2. `cd` into the directory: `$ cd gnome-mpris-label`
3. Checkout stable branch: `$ git checkout stable`
4. Run the installation script: `$ sh install.sh`

Skip the third step if you want the latest development version (warning: it could be broken or buggy)

## Contribution

Feel free to submit an issue if you have encountered a bug, want to ask something, want to share an idea for a feature, or something else entirely.

Feel free to submit a pull request for a bug you squashed, a feature you added, or anything you want merged to this repo.

If you want to help with the development of this extension then check out the [issues marked with the development tag](https://github.com/Moon-0xff/gnome-mpris-label/issues?q=is%3Aissue+is%3Aopen+label%3A%22development%22)
