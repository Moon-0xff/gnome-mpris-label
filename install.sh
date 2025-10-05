#!/bin/sh
DEFAULT_INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/mprisLabel@moon-0xff.github.com/"

if [ -d $DEFAULT_INSTALL_DIR ]; then
	rm -rf $DEFAULT_INSTALL_DIR
fi

mkdir -p $DEFAULT_INSTALL_DIR
cd "$(dirname "$0")"
printf "\e[32mCopying extension files to target directory...\e[0m"
cp -R ./* $DEFAULT_INSTALL_DIR
printf "\e[32mDone!\e[0m\n"

GNOME_VERSION=$(gnome-shell --version | awk -F'[ .]' '{print $3}') #get major Gnome version
if [ $GNOME_VERSION -ge 49 ]; then #apply patch if Gnome 49+
       printf "\e[33mYou are running GNOME 49 or above. The script will try to patch compatibility for this version. See README.md for details.\e[0m\n"
       patch -d $DEFAULT_INSTALL_DIR < patches/gnome49-compatibility.patch && printf "\e[32mGnome 49+ Patch applied!\e[0m\n" || { printf "\e[31mPatch failed!\e[0m\n"; exit 1 ; }
fi

if [ $XDG_SESSION_TYPE = "x11" ]; then
	printf "\n\e[32mAll files copied. \nPlease reload the gnome-shell (shortcut Alt + F2, r) to load the extension.\n\n\e[0m"
else
	printf "\n\e[32mAll files copied. \nPlease log out and log back in again to load the extension.\n\n\e[0m"
fi

cd $OLDPWD
