![alt text](https://github.com/Moon-0xff/gnome-mpris-label/raw/main/screenshot.png "extension screenshot")

# About
This GNOME extension reads metadata information from an mpris compatible player and displays it on the top bar. It works with Spotify, Vlc, Rhythmbox, Chromium based browsers and (probably) any mpris compatible player.

This extension was originally a fork for [mheine's gnome spotify label](https://github.com/mheine/gnome-shell-spotify-label). It quickly spiraled out of control and i ended up replacing or reverting all but a hint of the original code, so i decided to start this repository from scratch.

The idea of supporting all mpris compatible players (and how to do it) comes from this [pull request](https://github.com/mheine/gnome-shell-spotify-label/pull/21) in mheine's extension.

## Installation

### Using extensions.gnome.org
[Install this extension from extensions.gnome.org](https://extensions.gnome.org/extension/4928/mpris-label)

This is the recommended way of installing GNOME extensions, the browser plugin will install the extension in one click, and is just as easy to remove or manage.

It requires the installation of a browser plugin and a system package. Visit the page for further instructions.

### Using Git and the installation script
1. Clone this repository: `$ git clone https://github.com/Moon-0xff/gnome-mpris-label.git`
2. `cd` into the directory: `$ cd gnome-mpris-label`
3. Checkout the stable branch: `$ git checkout stable`
4. Run the installation script: `$ make install`

Skip the third step to install the development version.  
**Warning:** the latest development version could be broken or buggy

### More info about the installation

The default installation path is: `~/.local/share/gnome-shell/extensions/mprisLabel@moon-0xff.github.com/`

Running `make` will build the extensions in the `./build` directory which can be install by copying it to the installation path.

The makefile automatically patches the code for the current gnome-shell version using `./patch/apply.sh`.

## Contribution

Feel free to submit an issue if you have encountered a bug, want to ask something, want to share an idea for a feature, or something else entirely.

Feel free to submit a pull request for a bug you squashed, a feature you added, or anything you want merged to this repo.

Checkout [HACKING.md](https://github.com/Moon-0xff/gnome-mpris-label/blob/main/HACKING.md) for a quick guide on editing the source code.
