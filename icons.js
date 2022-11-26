const {Clutter,Gio,GLib,GObject,St} = imports.gi;

var IconHandler = class IconHandler {
	getIcon(app_name){
		return new St.Icon({
			icon_name: app_name,
			style_class: 'system-status-icon',
			fallback_icon_name: "com."+app_name+".Client", // icon name for flatpak, in case it's not a native build
			y_align: Clutter.ActorAlign.CENTER
		});
	}
}
