#!/bin/sh
DEFAULT_INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/mprisLabel@moon-0xff.github.com/"

if [ -d $DEFAULT_INSTALL_DIR ]; then
	rm -rf $DEFAULT_INSTALL_DIR
fi

mkdir -p $DEFAULT_INSTALL_DIR
cd "$(dirname "$0")"
printf "\e[32mCopying extension files to target directory...\e[0m"
cp -Rv ./* $DEFAULT_INSTALL_DIR
printf "\e[32mDone!\e[0m\n"

printf "\e[32mCompiling schemas...\e[0m"
if ! command -v glib-compile-schemas > /dev/null 2>&1; then
	printf "\n\e[31mError: 'glib-compile-schemas' not found.\e[0m\n"
	printf "\e[31mInstall it and run this script again.\e[0m\n\n"
	exit 1
fi

if ! glib-compile-schemas "$DEFAULT_INSTALL_DIR/schemas/"; then
	printf "\n\e[31mError: schema compilation failed, the extension won't load.\e[0m\n\n"
	exit 1
fi
printf "\e[32mDone!\e[0m\n"

# Extension source code already includes GNOME 49-50 compatibility

if [ $XDG_SESSION_TYPE = "x11" ]; then
	printf "\n\e[32mAll files copied. \nPlease reload the gnome-shell (shortcut Alt + F2, r) to load the extension.\n\n\e[0m"
else
	printf "\n\e[32mAll files copied. \nPlease log out and log back in again to load the extension.\n\n\e[0m"
fi

cd $OLDPWD
