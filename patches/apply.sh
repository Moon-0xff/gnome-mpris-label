#!/bin/sh
# Apply patches based on current gnome-shell version

if [ $# -eq 0 ]; then
	echo "Apply Patches Based on gnome-shell Version

Usage:
  $0 TARGET_DIRECTORY
"

	exit 1
fi
DIR="$1"
if [ ! -d "$DIR" ]; then
	echo "Directory '$DIR' missing"
	exit 1
fi


if [ "$(gnome-shell --version | awk -F'[ .]' '{print $3}')" -ge 45 ]; then
	patch -s -d "$DIR" < patches/gnome45-compatibility.patch
fi
if [ "$(gnome-shell --version | awk -F'[ .]' '{print $3}')" -ge 47 ]; then
	patch -s -d "$DIR" < patches/gnome47-compatibility.patch
fi

