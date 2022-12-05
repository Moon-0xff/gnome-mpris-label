const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const {Clutter,Gio,GLib,GObject,St} = imports.gi;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const CurrentExtension = ExtensionUtils.getCurrentExtension();

const {getDBusList,getPlayerStatus} = CurrentExtension.imports.dbus;
const {LabelBuilder} = CurrentExtension.imports.label;
const { getIcon } = CurrentExtension.imports.icons;

let LEFT_PADDING,RIGHT_PADDING,EXTENSION_INDEX,EXTENSION_PLACE,
	REFRESH_RATE,AUTO_SWITCH_TO_MOST_RECENT,
	REMOVE_TEXT_WHEN_PAUSED,SHOW_ICON;

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
		LEFT_PADDING = this.settings.get_int('left-padding');
		RIGHT_PADDING = this.settings.get_int('right-padding');
		EXTENSION_INDEX = this.settings.get_int('extension-index');
		EXTENSION_PLACE = this.settings.get_string('extension-place');
		SHOW_ICON = this.settings.get_boolean('show-icon');

		this.box = new St.BoxLayout({
			x_align: Clutter.ActorAlign.FILL
		});
		this._onPaddingChanged();//apply padding
		this.add_child(this.box);

		this.buttonText = new St.Label({
			text: "",
			y_align: Clutter.ActorAlign.CENTER
		});
		this.box.add_child(this.buttonText);

		this.connect('button-press-event',this._cyclePlayers.bind(this));

		this.settings.connect('changed::left-padding',this._onPaddingChanged.bind(this));
		this.settings.connect('changed::right-padding',this._onPaddingChanged.bind(this));
		this.settings.connect('changed::extension-index',this._updateTrayPosition.bind(this));
		this.settings.connect('changed::extension-place',this._updateTrayPosition.bind(this));
		this.settings.connect('changed::show-icon',this._updateSetIcon.bind(this));

		Main.panel.addToStatusArea('Mpris Label',this,EXTENSION_INDEX,EXTENSION_PLACE);

		this.labelBuilder = new LabelBuilder();

		this.playerList = [];

		this._refresh();
	}

	_cyclePlayers(){
		this._updatePlayerList();
		let list = this.playerList;

		if(AUTO_SWITCH_TO_MOST_RECENT)
			list = this.activePlayers;

		if(list < 2)
			return

		let newIndex = list.indexOf(this.player)+1;

		if(this.player == list.at(-1))
			newIndex = 0;

		this.player = list[newIndex];

		if (AUTO_SWITCH_TO_MOST_RECENT){
			this.player.statusTimestamp = new Date().getTime();
		}

		if (SHOW_ICON)
			this._updateSetIcon()
	}

	_onPaddingChanged(){
		LEFT_PADDING = this.settings.get_int('left-padding');
		RIGHT_PADDING = this.settings.get_int('right-padding');

		if (SHOW_ICON){
			if (RIGHT_PADDING < 5)
				RIGHT_PADDING = 0
			else
				RIGHT_PADDING = RIGHT_PADDING - 5
		}

		this.box.set_style("padding-left: " + LEFT_PADDING + "px;"
			+ "padding-right: " + RIGHT_PADDING  + "px; ");
	}

	_updateTrayPosition(){
		EXTENSION_PLACE = this.settings.get_string('extension-place');
		EXTENSION_INDEX = this.settings.get_int('extension-index');

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

	_refresh() {
		REFRESH_RATE = this.settings.get_int('refresh-rate');
		AUTO_SWITCH_TO_MOST_RECENT = this.settings.get_boolean('auto-switch-to-most-recent');
		REMOVE_TEXT_WHEN_PAUSED = this.settings.get_boolean('remove-text-when-paused');
		log("mpris-label ------------------------------------------------------------");
		let start_time = new Date().getTime();
		this._updatePlayerList();
		this._pickPlayer();
		this._setText();
		this._setIcon();
		this._removeTimeout();
		end_time = new Date().getTime(); step = end_time - start_time; log("mpris-label - cycle time:"+step+"ms");
		this._timeout = Mainloop.timeout_add(REFRESH_RATE, Lang.bind(this, this._refresh));
		return true;
	}

	_setIcon(){
		if (this.icon){
			this.box.remove_child(this.icon);
			this.icon = null;
		}

		if (!SHOW_ICON || !this.player)
			return

		if(REMOVE_TEXT_WHEN_PAUSED && this.player.playbackStatus != "Playing"){
				if(this.labelBuilder.removeTextPausedIsActive(this.player) && this.icon){
					this.box.remove_child(this.icon);
					this.icon = null;
				}
				return
		}

		this.icon = this.player.icon

		if (this.icon != null | undefined)
			this.box.add_child(this.icon);
	}

	_updateSetIcon(){
		SHOW_ICON = this.settings.get_boolean('show-icon');
		this._setIcon();
	}

	_updatePlayerList(){
		let dBusList = getDBusList();

		this.playerList = this.playerList.filter(element => dBusList.includes(element.address));

		let addresses = [];
		this.playerList.forEach(element => {
			element.update();
			addresses.push(element.address);
		});

		let newPlayers = dBusList.filter(element => !addresses.includes(element));
		newPlayers.forEach(element => this.playerList.push(new Player(element)));

		if (AUTO_SWITCH_TO_MOST_RECENT)
			this.activePlayers = this.playerList.filter(element => element.playbackStatus == "Playing")
	}

	_pickPlayer(){
		if(this.playerList.length == 0){
			this.player = null;
			return;
		}

		if(this.playerList.includes(this.player) && !AUTO_SWITCH_TO_MOST_RECENT)
			return

		let newestTimestamp = 0;
		let bestChoice = this.playerList[0];
		let list = this.playerList;

		if (AUTO_SWITCH_TO_MOST_RECENT){
			if(this.activePlayers.length == 0){
				if(REMOVE_TEXT_WHEN_PAUSED)
					this.player = null
					
				return;
			}
			list = this.activePlayers;
		}

		list.forEach(player => {
			if(player.statusTimestamp > newestTimestamp){
				newestTimestamp = player.statusTimestamp;
				bestChoice = player;
			}
		});
		this.player = bestChoice;
	}

	_setText() {
		try{
			if(this.player == null || undefined)
				this.buttonText.set_text("")
			else
				this.buttonText.set_text(this.labelBuilder.buildLabel(this.player,this.activePlayers));
		}
		catch(err){
			log("Mpris Label: " + err);
			this.buttonText.set_text("");
		}
	}

	_removeTimeout() {
		if (this._timeout) {
			Mainloop.source_remove(this._timeout);
			this._timeout = null;
		}
	}

	_disable(){
		if(this.icon)
			this.box.remove_child(this.icon);

		this.box.remove_child(this.buttonText);
		this.remove_child(this.box);
		this._removeTimeout();
	}
}
);

class Player {
	constructor(address){
		this.address = address;
		this.statusTimestamp = new Date().getTime();
		this.icon = getIcon(address);
		if(REMOVE_TEXT_WHEN_PAUSED || AUTO_SWITCH_TO_MOST_RECENT)
			this.playbackStatus = getPlayerStatus(address)
	}
	update(){
		if(REMOVE_TEXT_WHEN_PAUSED || AUTO_SWITCH_TO_MOST_RECENT){
			let playbackStatus = getPlayerStatus(this.address);

			if(this.playbackStatus != playbackStatus){
				this.playbackStatus = playbackStatus;
				this.statusTimestamp = new Date().getTime();
			}
		}
	}
}

