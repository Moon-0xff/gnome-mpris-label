![alt text](https://github.com/Moon-0xff/gnome-mpris-label/raw/main/screenshot.png "extension screenshot")

# About
This GNOME extension reads metadata information from an mpris compatible player and displays it on the top bar. It works with Spotify, Vlc, Rhythmbox, Chromium based browsers and (probably) any mpris compatible player.

This extension was originally a fork for [mheine's gnome spotify label](https://github.com/mheine/gnome-shell-spotify-label). It quickly spiraled out of control and i ended up replacing or reverting all but a hint of the original code, so i decided to start this repository from scratch.

The idea of supporting all mpris compatible players (and how to do it) comes from this [pull request](https://github.com/mheine/gnome-shell-spotify-label/pull/21) in mheine's extension.

## Installation

### One click installation from extensions.gnome.org

[Install this extension in one click from extensions.gnome.org](https://extensions.gnome.org/extension/4928/mpris-label)

If this is your first time installing an extension perhaps you don't have the necessary software to do it though. Visit the page for further instructions

### Installing the GNOME 45 version using git
both `main` and `stable` branches provide the GNOME 43/44 compatible version of this extension.  
To get 45 compatibility, you need to **patch it**.  
Here's the instructions:
1. Follow the instructions to install the 43/44 version with git below (Using Git / Using Git and the installation script)
2. `cd` into the installation directory, default path is `~/.local/share/gnome-shell/extensions/mprisLabel@moon-0xff.github.com`
3. Apply the patch: `$ patch < patches/gnome45-compatibility.patch`
4. All done, log out and log back again and the extension should be compatible with 45, if not, raise an issue to let us know

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

Checkout [HACKING.md](https://github.com/Moon-0xff/gnome-mpris-label/blob/main/HACKING.md) for a quick guide on editing the source code.
