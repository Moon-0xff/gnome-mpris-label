UUID = mprisLabel@moon-0xff.github.com
ZIP_FILE = $(UUID).shell-extension.zip
BUILD_DIR = build


.PHONY: build install clean

build: src/* patches/*
	@rm -rf $(BUILD_DIR)
	cp -r src $(BUILD_DIR)
	glib-compile-schemas --strict $(BUILD_DIR)/schemas
	./patches/apply.sh $(BUILD_DIR)
	@rm -f $(ZIP_FILE)
	gnome-extensions pack --extra-source=players.js --extra-source=label.js $(BUILD_DIR)

install: $(ZIP_FILE)
	gnome-extensions install $(ZIP_FILE)


clean:
	@rm -rf $(BUILD_DIR) $(ZIP_FILE)
