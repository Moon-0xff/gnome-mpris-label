const {Clutter,Gio,GLib,GObject,St} = imports.gi;

var IconHandler = class IconHandler {
	getIcon(app_name){
		return new St.Icon({
			icon_name: app_name,
			style_class: "system-status-icon"
		});
	}
}
