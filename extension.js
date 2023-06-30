const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const {Clutter,Gio,GLib,GObject,St} = imports.gi;
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
		this.players.connect('selected-changed',this._onSelectedChanged.bind(this));

		this.connect('button-press-event',(_a, event) => this._onClick(event));
		this.connect('scroll-event', (_a, event) => this._onScroll(event));

		this.volumeControl = Volume.getMixerControl();
		this.volumeControl.connect("stream-added", this._getStream.bind(this));
		this.volumeControl.connect("stream-removed",this._getStream.bind(this));

		this.settings.connect('changed::left-padding',this._onPaddingChanged.bind(this));
		this.settings.connect('changed::right-padding',this._onPaddingChanged.bind(this));
		this.settings.connect('changed::extension-index',this._updateTrayPosition.bind(this));
		this.settings.connect('changed::extension-place',this._updateTrayPosition.bind(this));
		this.settings.connect('changed::show-icon',this._setIcon.bind(this));
		this.settings.connect('changed::use-album',this._setIcon.bind(this));
		this.settings.connect('changed::album-size',this._setIcon.bind(this));
		this.settings.connect('changed::album-blacklist',this._setIcon.bind(this));
		this.settings.connect('changed::divider-string',this._setText.bind(this))
		this.settings.connect('changed::first-field',this._setText.bind(this));
		this.settings.connect('changed::second-field',this._setText.bind(this));
		this.settings.connect('changed::third-field',this._setText.bind(this));
		this.settings.connect('changed::symbolic-source-icon', this._setIcon.bind(this));
		this.settings.connect('changed::icon-padding', this._setIcon.bind(this));

		Main.panel.addToStatusArea('Mpris Label',this,EXTENSION_INDEX,EXTENSION_PLACE);

		this._hideLabel()

		this._repositionTimeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT,REPOSITION_DELAY,this._updateTrayPosition.bind(this));
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

		if (this.container.get_parent())
			this.container.get_parent().remove_child(this.container);

		if (EXTENSION_PLACE == "left"){
			Main.panel._leftBox.insert_child_at_index(this.container, EXTENSION_INDEX);
		}
		else if (EXTENSION_PLACE == "center"){
			Main.panel._centerBox.insert_child_at_index(this.container, EXTENSION_INDEX);
		}
		else if (EXTENSION_PLACE == "right"){
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
			case 8:
				this._activateButton('thumb-backward-action');
				return Clutter.EVENT_STOP;
			case 9:
				this._activateButton('thumb-forward-action')
				return Clutter.EVENT_STOP;
		}
	}

	_onScroll(event) {
		const SCROLL_ACTION = this.settings.get_string('scroll-action');

		if(SCROLL_ACTION == 'none')
			return Clutter.EVENT_STOP

		if (event.is_pointer_emulated())
			return Clutter.EVENT_PROPAGATE;

		if (event.get_scroll_direction() == Clutter.ScrollDirection.SMOOTH){
			let delta = -event.get_scroll_delta()[1];
			delta = Math.clamp(-1,delta,1);

			if(!delta == 0)
				this._changeVolume(delta)

			return Clutter.EVENT_STOP;
		}
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
					this.player.activatePlayer();
				break;
			case 'open-menu':
				this._buildMenu();
				this.menu.toggle();
				break;
			case 'next-player':
				this.players.next();
				break;
			case 'volume-up':
				this._changeVolume(1);
				break;
			case 'volume-down':
				this._changeVolume(-1);
				break;
			case 'volume-mute':
				this._changeVolume(0);
				break;
		}
	}

	_changeVolume(delta){
		let stream = [];
		stream[0] = this.volumeControl.get_default_sink();
		let stream_name = 'System Volume (Global)';

		const CONTROL_SCHEME = this.settings.get_string('volume-control-scheme');

		if(CONTROL_SCHEME == 'application' && this.player){
			if(this.stream.length == 0)
				this._getStream();

			if (this.stream.length > 0){
				stream = this.stream;
				stream_name = this.player.identity;
			}
		}

		let max = this.volumeControl.get_vol_max_norm()
		let step = max / 30;
		let volume = stream[0].volume;
		stream.forEach(stream => {//if multiple stream, use the lowest as base reference
			if (stream.volume < volume)
				volume = stream.volume;
		});

		let newVolume = volume + step * delta;
		newVolume = Math.round(Math.clamp(0,newVolume,max));

		stream.forEach(stream => {
			stream.volume = newVolume;
			stream.push_volume();
		});

		let volumeRatio = newVolume/max;
		let monitor = global.display.get_current_monitor(); //identify current monitor for OSD

		if(delta == 0){//toggle mute
			stream.forEach(stream => {
				stream.change_is_muted(!stream.is_muted);
				if(!stream.is_muted) //set mute icon
					volumeRatio = 0
			});
		}

		const icon = Gio.Icon.new_for_string(this._setVolumeIcon(volumeRatio));
		Main.osdWindowManager.show(monitor, icon, stream_name, volumeRatio);
	}

	_getStream(){
		if(!this.player || !this.player.identity)
			return

		const streamList = this.volumeControl.get_streams();
		this.stream = [];

		streamList.forEach(stream => {
			if(stream.get_name() && stream.get_name().toLowerCase() == this.player.identity.toLowerCase())
				this.stream.push(stream);
		});

		if (this.stream.length > 0)
			return this.stream

		streamList.forEach(stream => {
			if(
				stream.get_name() && (
				stream.get_name().match(new RegExp(this.player.identity,"i")) ||
				this.player.identity.match(new RegExp(stream.get_name(),"i")) )
			)
				this.stream.push(stream);
		});

		return this.stream
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

				this.players.pick();
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

	_onSelectedChanged(){
		this.player = this.players.selected;

		this._getStream();
		this._setText();
		this._setIcon();

		this.player.connect('updated', () => {
			const REMOVE_TEXT_WHEN_PAUSED = this.settings.get_boolean('remove-text-when-paused');
			const REMOVE_TEXT_PAUSED_DELAY = this.settings.get_int('remove-text-paused-delay');
			const BUTTON_PLACEHOLDER = this.settings.get_string('button-placeholder');

			if(REMOVE_TEXT_WHEN_PAUSED && this.player.playbackStatus==="Paused"){
				this._pauseTimeout =
					GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT,
					REMOVE_TEXT_PAUSED_DELAY, () => {
						if (this.player && this.player.playbackStatus === "Paused")
							this.label.set_text(BUTTON_PLACEHOLDER);
					});

			} else{
				if (this._pauseTimeout){
					GLib.Source.remove(this._pauseTimeout);
					this._pauseTimeout = null;
				}
					this._showLabel();
			}

			this._setText();
			this._setIcon();
		});

		this.player.connect('entry-ready', () => {
			this._getStream();
			this._setIcon();
		});
	}

	_setIcon(){
		const ICON_PLACE = this.settings.get_string('show-icon');
		const ICON_PADDING = this.settings.get_int('icon-padding');
		const PLACEHOLDER = this.settings.get_string('button-placeholder');
		const SYMBOLIC_ICON = this.settings.get_boolean('symbolic-source-icon');
		const USE_ALBUM = this.settings.get_boolean('use-album');
		const ALBUM_BLACKLIST = this.settings.get_string('album-blacklist').trim();

		if(this.icon){
			this.box.remove_child(this.icon);
			this.icon = null;
		}

		if(!ICON_PLACE || !this.player || this.label.get_text() == "" || this.label.get_text() == PLACEHOLDER)
			return

		if(USE_ALBUM){
			const ALBUM_SIZE = this.settings.get_int('album-size');
			let size = Math.floor(Main.panel.height*ALBUM_SIZE/100);

			const blacklist = ALBUM_BLACKLIST.toLowerCase().replaceAll(' ','').split(',');
			if(!blacklist.includes(this.player.identity.toLowerCase()))
				this.icon = this.player.getArtUrlIcon(size);
		}

		if(this.icon == null){
			this.icon = this.player.getIcon(SYMBOLIC_ICON);
			if (SYMBOLIC_ICON)
				this.icon.set_style('-st-icon-style: symbolic;');
		}

		if (this.icon != null | undefined){
			if (ICON_PLACE == "right"){
				this.icon.set_style(this.icon.get_style() + "padding-left: " + ICON_PADDING + "px;padding-right: 0px;");
				this.box.add_child(this.icon);
			}
			else if (ICON_PLACE == "left"){
				this.icon.set_style(this.icon.get_style() + "padding-left: 0px;padding-right: " + ICON_PADDING + "px;");
				this.box.insert_child_at_index(this.icon,0);
			}
		}
	}

	_setText() {
		try{
			if(this.player == null || undefined)
				this._hideLabel();
			else {
				const label = buildLabel(this.players)
				if(label.length == 0)
					this._hideLabel();
				else
					this.label.set_text(label);
			}
		}
		catch(err){
			log("Mpris Label: " + err);
			this._hideLabel();
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

		if (this._repositionTimeout){
			GLib.Source.remove(this._repositionTimeout);
			this._repositionTimeout = null;
		}

		if (this._pauseTimeout){
			GLib.Source.remove(this._pauseTimeout);
			this._pauseTimeout = null;
		}
	}

	_hideLabel(){
		if(this.visible)
			this.hide();
	}

	_showLabel(){
		if(!this.visible)
			this.show()
	}
});

