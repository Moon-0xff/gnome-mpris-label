#!/bin/sh
DEFAULT_INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/mprisLabel@moon-0xff.github.com/"

if [ -d $DEFAULT_INSTALL_DIR ]; then
	rm -rf $DEFAULT_INSTALL_DIR
fi

mkdir -p $DEFAULT_INSTALL_DIR
cd "$(dirname "$0")"
printf "\e[32mCopying extension files to target directory:\n\e[0m"
cp -Rv ./* $DEFAULT_INSTALL_DIR

gnomeVersion=$(gnome-shell --version | awk -F'[ .]' '{print $3}') #get major Gnome version
if [ $gnomeVersion -ge 45 ]; then #apply patch if Gnome 45+
	if ! command -v patch > /dev/null #check if patch is installed...
	then
		printf "\e\n[31mYou are running GNOME 45 or greater and will need to apply the compatibility patch.\nPlease install the 'patch' utility and rerun this script. See README.md for instructions.\n\n\e[0m"
		exit 1
	else
		printf "\e\n[33mYou are running GNOME 45 or greater. Applying the compatibility patch... \nSee README.md for details.\n\e[0m"
		patch -d $DEFAULT_INSTALL_DIR < patches/gnome45-compatibility.patch
	fi
fi

if [ $XDG_SESSION_TYPE = "x11" ]; then
	printf "\n\e[32mAll files copied. \nPlease reload the gnome-shell (shortcut Alt + F2, r) to load the extension.\n\n\e[0m"
else
	printf "\n\e[32mAll files copied. \nPlease log out and log back in again to load the extension.\n\n\e[0m"
fi

cd $OLDPWD
