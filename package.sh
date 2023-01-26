#!/bin/sh
# This script packages the extension for ego release

zip -r extension.zip icons.js label.js metadata.json prefs.js schemas/ extension.js LICENSE players.js README.md screenshot.png
echo
unzip -l extension.zip
