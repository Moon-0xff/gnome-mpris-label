#!/bin/sh
# This script packages the extension for ego release

zip -r extension.zip label.js metadata.json prefs.js schemas/ extension.js LICENSE players.js README.md
echo
unzip -l extension.zip
