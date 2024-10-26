#!/bin/sh
DEFAULT_INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/mprisLabel@moon-0xff.github.com/"

if [ -d $DEFAULT_INSTALL_DIR ]; then
	rm -rf $DEFAULT_INSTALL_DIR
fi

mkdir -p $DEFAULT_INSTALL_DIR
cd "$(dirname "$0")"
printf "\e[32mCopying extension files to target directory:\n\e[0m"
cp -Rv ./* $DEFAULT_INSTALL_DIR

GNOME_VERSION=$(gnome-shell --version | awk -F'[ .]' '{print $3}') #get major Gnome version
if [ $GNOME_VERSION -ge 45 ]; then #apply patch if Gnome 45+
	echo "You are running GNOME 45 or above. The script will try to patch compatibility for this version. See README.md for details."
	patch -d $DEFAULT_INSTALL_DIR < patches/gnome45-compatibility.patch && echo "Gnome 45+ Patch applied!" || { echo "Patch failed!"; exit 1 ; }
	if [ $GNOME_VERSION -ge 47 ]; then #apply patch if Gnome 47+
		echo "You are running GNOME 47 or above."
		patch --no-backup-if-mismatch -d $DEFAULT_INSTALL_DIR < patches/gnome47-compatibility.patch && echo "Gnome 47+ Patch applied!" || { echo "Patch failed!"; exit 1 ; }
	fi
fi

if [ $XDG_SESSION_TYPE = "x11" ]; then
	printf "\n\e[32mAll files copied. \nPlease reload the gnome-shell (shortcut Alt + F2, r) to load the extension.\n\n\e[0m"
else
	printf "\n\e[32mAll files copied. \nPlease log out and log back in again to load the extension.\n\n\e[0m"
fi

cd $OLDPWD
