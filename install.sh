#!/bin/sh
DEFAULT_INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/mprisLabel@moon-0xff.github.com/"

if [ -d $DEFAULT_INSTALL_DIR ]; then
	rm -rf $DEFAULT_INSTALL_DIR
fi

mkdir -p $DEFAULT_INSTALL_DIR
cd "$(dirname "$0")"
printf "\e[32mCopying extension files to target directory:\n\e[0m"
cp -Rv ./* $DEFAULT_INSTALL_DIR
printf "\n\e[32mAll files copied. Please reload by logging back in if using Wayland or reload the shell (Alt + F2, r) if using X11\n\n\e[0m"

#keep terminal open if script run from file browser
$SHELL
