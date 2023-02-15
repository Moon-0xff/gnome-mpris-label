const {Clutter,Gio,GLib,GObject,Shell,St} = imports.gi;
const Config = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;

var getIcon = function getIcon(playerIdentity){
	const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');
	const ICON_PLACE = settings.get_string('show-icon');

	let icon_left_padding = 0;
	let icon_right_padding = 0;
	if (Config.PACKAGE_VERSION.startsWith("3."))
		if (ICON_PLACE == "right")
			icon_left_padding = 3
		else if (ICON_PLACE == "left")
			icon_right_padding = 3

		let icon = new St.Icon({
		style_class: 'system-status-icon',
		fallback_icon_name: 'audio-volume-high',
		style: "padding-left: " + icon_left_padding + "px;padding-right: " + icon_right_padding + "px;"
	});

	if(playerIdentity == null | undefined)
		return icon

	let matchedEntries = Gio.DesktopAppInfo.search(playerIdentity.toString());
	let suspectMatch = matchedEntries[0][0];

	if(suspectMatch == null)
		return icon

	let entry = Gio.DesktopAppInfo.new(suspectMatch);
	let gioIcon = entry.get_icon();
	icon.set_gicon(gioIcon);
	return icon
}