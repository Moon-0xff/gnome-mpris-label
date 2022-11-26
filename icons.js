const {Clutter,Gio,GLib,GObject,Shell,St} = imports.gi;
const Panel = imports.ui.panel;

let fallbackIcon = new St.Icon({
	style_class: 'system-status-icon',
	icon_name: 'rhythmbox'
});

var getIcon = function getIcon(){
	let tracker = Shell.WindowTracker.get_default();
	let focusedApp = tracker.focus_app; 

	if (!focusedApp)
		return fallbackIcon;

	const icon = focusedApp.create_icon_texture(Panel.PANEL_ICON_SIZE - Panel.APP_MENU_ICON_MARGIN);
	return icon
}
