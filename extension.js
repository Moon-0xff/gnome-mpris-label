const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const {Shell,Clutter,Gio,GLib,GObject,St} = imports.gi;
const Mainloop = imports.mainloop;
const ExtensionUtils = imports.misc.extensionUtils;
const CurrentExtension = ExtensionUtils.getCurrentExtension();
const Volume = imports.ui.status.volume;

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

		const EXTENSION_INDEX = this.settings.get_int('extension-index');
		const EXTENSION_PLACE = this.settings.get_string('extension-place');
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

		this.connect('button-press-event',(_a, event) => this._onClick(event));
		this.connect('scroll-event', (_a, event) => this._onScroll(event));

		this.volumeControl = Volume.getMixerControl();

		this.settings.connect('changed::left-padding',this._onPaddingChanged.bind(this));
		this.settings.connect('changed::right-padding',this._onPaddingChanged.bind(this));
		this.settings.connect('changed::extension-index',this._updateTrayPosition.bind(this));
		this.settings.connect('changed::extension-place',this._updateTrayPosition.bind(this));
		this.settings.connect('changed::show-icon',this._setIcon.bind(this));

		Main.panel.addToStatusArea('Mpris Label',this,EXTENSION_INDEX,EXTENSION_PLACE);

		this._repositionTimeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT,REPOSITION_DELAY,this._updateTrayPosition.bind(this));

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

	_determineColors(){
		let themeNode = this.get_theme_node();
		let fg = themeNode.get_foreground_color();
		let bg = themeNode.get_background_color();

		//Clutter.Color doesn't have a method for average mixing
		const channels = [[fg.red,bg.red],[fg.green,bg.green],[fg.blue,bg.blue],[fg.alpha,bg.alpha]];
		let new_channels = [];
		channels.forEach(channel => {
			new_channels.push(Math.round((channel[0] + channel[1]) / 2));
		});

		let mixedColor = Clutter.Color.new(new_channels[0],new_channels[1],new_channels[2],new_channels[3]);
		let color_str = mixedColor.to_string();
		this.unfocusColor = color_str.substring(0,7); //ignore alpha channel
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

	_onClick(event){
		const REPOSITION_ON_BUTTON_PRESS = this.settings.get_boolean('reposition-on-button-press');

		if (REPOSITION_ON_BUTTON_PRESS)
			this._updateTrayPosition(); //force tray position update on button press

		switch(event.get_button()){
			case Clutter.BUTTON_PRIMARY:
				this._activateButton('left-click-action');
				return Clutter.EVENT_STOP;
			case Clutter.BUTTON_MIDDLE:
				this._activateButton('middle-click-action');
				return Clutter.EVENT_STOP;
			case Clutter.BUTTON_SECONDARY:
				this._activateButton('right-click-action');
				return Clutter.EVENT_STOP;
		}
	}

	_onScroll(event) {
		if (event.is_pointer_emulated())
			return Clutter.EVENT_PROPAGATE;

		if (event.get_scroll_direction() == Clutter.ScrollDirection.SMOOTH){
			let delta = -event.get_scroll_delta()[1];
			delta = Math.clamp(-1,delta,1);

			if(delta == 1)
				this._activateButton('scroll-up-action');
			else if(delta == -1)
				this._activateButton('scroll-down-action');

			return Clutter.EVENT_STOP;
		}
	}

	_changeVolume(delta){
		const VOLUME_CONTROL = this.settings.get_string('volume-control-scheme');
		let stream = "";
		let stream_name = undefined;
		switch(VOLUME_CONTROL) {
			case 'application':
				if (this.player){
					stream = this._getStream();
					stream_name = this.player.identity;
				}
				else
					return
				break;
			case 'global': 
				stream = this.volumeControl.get_default_sink();
				break;
		}

		let max = this.volumeControl.get_vol_max_norm()
		let step = max / 30;
		let volume = stream.volume;

		let newVolume = volume + step * delta;
		newVolume = Math.round(Math.clamp(0,newVolume,max));

		stream.volume = newVolume;
		stream.push_volume();

		let volumeRatio = newVolume/max;
		let monitor = global.display.get_current_monitor(); //identify current monitor for OSD
		const icon = Gio.Icon.new_for_string(this._setVolumeIcon(volumeRatio));
		Main.osdWindowManager.show(monitor, icon, stream_name, volumeRatio);
	}

	_getStream(){
		const streamList = this.volumeControl.get_streams();
		let stream_id = "";
		streamList.forEach(stream => {
			let name = stream.get_name().toLowerCase();
			let identity = this.player.identity.toLowerCase();
			if (name==identity){
				stream_id = stream.get_id();
				log(Date().substring(16,24)+' gnome-mpris-label-batwam/extension.js - exact match: '+name+' (stream #'+stream_id+')');
			}
		});
		if (!stream_id){ //fuzzy match fallback
			streamList.forEach(stream => {
				let name = stream.get_name().toLowerCase();
				let identity = this.player.identity.toLowerCase();
				if (name.includes(identity) ||identity.includes(name)){
					stream_id = stream.get_id();
					log(Date().substring(16,24)+' gnome-mpris-label-batwam/extension.js - fuzzy match: '+name+'/'+identity+' (stream #'+stream_id+')');
				}
			});
		}
		return this.volumeControl.lookup_stream_id(stream_id);
	}

	_setVolumeIcon(volume) {
		let volume_icon = 'audio-volume-high-symbolic';
		switch (true) {
			case (volume == 0):
				volume_icon = 'audio-volume-muted-symbolic';
				break
			case (volume < 0.33):
				volume_icon = 'audio-volume-low-symbolic';
				break
			case (volume < 0.67):
				volume_icon = 'audio-volume-medium-symbolic';
				break
		}
		return volume_icon
	}

	_activateButton(option) {
		const value = this.settings.get_string(option);

		switch(value){
			case 'play-pause':
				if(this.player)
					this.player.toggleStatus();
				break;
			case 'next-track':
				if(this.player)
					this.player.goNext();
				break;
			case 'prev-track':
				if(this.player)
					this.player.goPrevious();
				break;
			case 'activate-player':
				if(this.player)
					this._activatePlayer();
				break;
			case 'open-menu':
				this._buildMenu();
				this.menu.toggle();
				break;
			case 'next-player':
				this.player = this.players.next();
				this._refresh();
				break;
			case 'volume-up':
				this._changeVolume(1);
				break;
			case 'volume-down':
				this._changeVolume(-1);
				break;
		}
	}
	
	_activatePlayer(){
		let playerObject = Shell.AppSystem.get_default().lookup_app(this.player.desktopApp);
		playerObject.activate();
	}

	_buildMenu(){
		const AUTO_SWITCH_TO_MOST_RECENT = this.settings.get_boolean('auto-switch-to-most-recent');

		this.menu.removeAll(); //start by deleting everything

	//player selection submenu:
		this.players.list.forEach(player => {
			let settingsMenuItem = new PopupMenu.PopupMenuItem(player.identity);

			if (AUTO_SWITCH_TO_MOST_RECENT){
				if(!this.unfocusColor)
					this._determineColors();

				settingsMenuItem.label.set_style('font-style:italic');
				settingsMenuItem.set_style('color:' + this.unfocusColor);
			}

			//if item is active player, include DOT if auto mode, CHECK if manual mode
			if (this.player) {
				if (this.player.address ==  player.address) {
					if (AUTO_SWITCH_TO_MOST_RECENT)
						settingsMenuItem.setOrnament(PopupMenu.Ornament.DOT);
					else {
						settingsMenuItem.setOrnament(PopupMenu.Ornament.CHECK);
						settingsMenuItem.label.set_style('font-weight:bold');
					}
				}
			}

			settingsMenuItem.connect('activate', () => {
				if (AUTO_SWITCH_TO_MOST_RECENT)
					this.settings.set_boolean('auto-switch-to-most-recent',false);

				this.players.selected = player; //this.player should sync with this on the next refresh
				this._refresh();                //so let's refresh right away
			});

			this.menu.addMenuItem(settingsMenuItem);
		});

	//automode entry:
		if (this.players.list.length > 0){
			let settingsMenuItem = new PopupMenu.PopupMenuItem('Switch Automatically');
			if (AUTO_SWITCH_TO_MOST_RECENT) {
				settingsMenuItem.setOrnament(PopupMenu.Ornament.CHECK);
				settingsMenuItem.label.set_style('font-weight:bold');
			}

			this.menu.addMenuItem(settingsMenuItem);
			settingsMenuItem.connect('activate', () =>{
				this.settings.set_boolean('auto-switch-to-most-recent',!AUTO_SWITCH_TO_MOST_RECENT);
			});
			this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem()); //add separator
		}

	//settings shortcut:
		this.menu.addAction(_('Settings'), () => ExtensionUtils.openPrefs());
	}

	_refresh() {
		const REFRESH_RATE = this.settings.get_int('refresh-rate');
		const VOLUME_CONTROL = this.settings.get_string('volume-control-scheme');

		this.previousPlayer = this.player
		this.players.updateActiveList();
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

	vfunc_event(event){
		return Clutter.EVENT_PROPAGATE;
	}

	_disable(){
		if(this.icon)
			this.box.remove_child(this.icon);

		this.box.remove_child(this.label);
		this.remove_child(this.box);
		this._removeTimeout();

		if (this._repositionTimeout){
			GLib.Source.remove(this._repositionTimeout);
			this._repositionTimeout = null;
		}
	}
});

