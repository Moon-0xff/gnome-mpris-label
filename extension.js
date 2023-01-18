const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const {Clutter,Gio,GLib,GObject,St} = imports.gi;
const Mainloop = imports.mainloop;
const ExtensionUtils = imports.misc.extensionUtils;
const CurrentExtension = ExtensionUtils.getCurrentExtension();

const { Players } = CurrentExtension.imports.players;
const { buildLabel } = CurrentExtension.imports.label;

let indicator = null;

function enable(){
	indicator = new MprisLabel();
}

function disable(){
	indicator._disable();
	indicator.destroy();
	indicator = null;
}

var MprisLabel = GObject.registerClass(
	{ GTypeName: 'MprisLabel' },
class MprisLabel extends PanelMenu.Button {
	_init(){
		super._init(0.0,'Mpris Label',false);

		this.settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');

		const LEFT_PADDING = this.settings.get_int('left-padding');
		const RIGHT_PADDING = this.settings.get_int('right-padding');
		const EXTENSION_INDEX = this.settings.get_int('extension-index');
		const EXTENSION_PLACE = this.settings.get_string('extension-place');
		const SHOW_ICON = this.settings.get_string('show-icon');
		const REPOSITION_DELAY = this.settings.get_int('reposition-delay');

		this.box = new St.BoxLayout({
			x_align: Clutter.ActorAlign.FILL
		});
		this._onPaddingChanged();//apply padding
		this.add_child(this.box);

		this.label = new St.Label({
			text: "",
			y_align: Clutter.ActorAlign.CENTER
		});
		this.box.add_child(this.label);

		this.players = new Players();

		this.connect('button-press-event',this._onButtonPressed.bind(this));

		this.settings.connect('changed::left-padding',this._onPaddingChanged.bind(this));
		this.settings.connect('changed::right-padding',this._onPaddingChanged.bind(this));
		this.settings.connect('changed::extension-index',this._updateTrayPosition.bind(this));
		this.settings.connect('changed::extension-place',this._updateTrayPosition.bind(this));
		this.settings.connect('changed::show-icon',this._setIcon.bind(this));

		Main.panel.addToStatusArea('Mpris Label',this,EXTENSION_INDEX,EXTENSION_PLACE);

		const repositionTimeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT,REPOSITION_DELAY,this._updateTrayPosition.bind(this));

		this._refresh();
	}

	_onPaddingChanged(){
		const ICON_PLACE = this.settings.get_string('show-icon');
		let LEFT_PADDING = this.settings.get_int('left-padding');
		let RIGHT_PADDING = this.settings.get_int('right-padding');
		const SHOW_ICON = this.settings.get_string('show-icon');

		if(SHOW_ICON){
			if (ICON_PLACE == "right")
				RIGHT_PADDING = Math.max(0,RIGHT_PADDING - 5)
			else
				LEFT_PADDING = Math.max(0,LEFT_PADDING - 5)
		}

		this.box.set_style("padding-left: " + LEFT_PADDING + "px;"
			+ "padding-right: " + RIGHT_PADDING  + "px; ");
	}

	_updateTrayPosition(){
		const EXTENSION_PLACE = this.settings.get_string('extension-place');
		const EXTENSION_INDEX = this.settings.get_int('extension-index');

		this.container.get_parent().remove_child(this.container);

		if(EXTENSION_PLACE == "left"){
			Main.panel._leftBox.insert_child_at_index(this.container, EXTENSION_INDEX);
		}
		else if(EXTENSION_PLACE == "center"){
			Main.panel._centerBox.insert_child_at_index(this.container, EXTENSION_INDEX);
		}
		else if(EXTENSION_PLACE == "right"){
			Main.panel._rightBox.insert_child_at_index(this.container, EXTENSION_INDEX);
		}
	}

	_onButtonPressed(){
		this.player = this.players.next();
		this._setIcon();

		const REPOSITION_ON_BUTTON_PRESS = this.settings.get_boolean('reposition-on-button-press');

		if (REPOSITION_ON_BUTTON_PRESS)
			this._updateTrayPosition(); //force tray position update on button press
	}

	_refresh() {
		const REFRESH_RATE = this.settings.get_int('refresh-rate');

		this.player = this.players.pick();
		this._setText();
		this._setIcon();
		this._removeTimeout();

		this._timeout = Mainloop.timeout_add(REFRESH_RATE, this._refresh.bind(this));
		return true;
	}

	_setIcon(){
		const ICON_PLACE = this.settings.get_string('show-icon');
		const PLACEHOLDER = this.settings.get_string('button-placeholder');

		if(this.icon){
			this.box.remove_child(this.icon);
			this.icon = null;
		}

		if(!ICON_PLACE || !this.player || this.label.get_text() == "" || this.label.get_text() == PLACEHOLDER)
			return

		this.icon = this.player.icon

		if (this.icon != null | undefined){
			if (ICON_PLACE == "right")
				this.box.add_child(this.icon);
			else if (ICON_PLACE == "left")
				this.box.insert_child_at_index(this.icon,0);
		}
	}

	_setText() {
		try{
			if(this.player == null || undefined)
				this.label.set_text("")
			else
				this.label.set_text(buildLabel(this.players));
		}
		catch(err){
			log("Mpris Label: " + err);
			this.label.set_text("");
		}
	}

	_removeTimeout() {
		if(this._timeout) {
			Mainloop.source_remove(this._timeout);
			this._timeout = null;
		}
	}

	_disable(){
		if(this.icon)
			this.box.remove_child(this.icon);

		this.box.remove_child(this.label);
		this.remove_child(this.box);
		this._removeTimeout();
	}
});

