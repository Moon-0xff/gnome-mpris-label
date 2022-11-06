const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const {Clutter,Gio,GLib,GObject,St} = imports.gi;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;

let LEFT_PADDING,RIGHT_PADDING,MAX_STRING_LENGTH,EXTENSION_INDEX,
	EXTENSION_PLACE,REFRESH_RATE,BUTTON_PLACEHOLDER,
	REMOVE_REMASTER_TEXT,DIVIDER_STRING,FIRST_FIELD,SECOND_FIELD,
	LAST_FIELD,REMOVE_TEXT_WHEN_PAUSED,AUTO_SWITCH_TO_MOST_RECENT;

const playerInterface = `
<node>
	<interface name="org.mpris.MediaPlayer2.Player">
		<property name="Metadata" type="a{sv}" access="read"/>
	</interface>
</node>`

const statusInterface = `
<node>
	<interface name="org.mpris.MediaPlayer2.Player">
		<property name="PlaybackStatus" type="s" access="read"/>
	</interface>
</node>`

const dBusInterface = `
<node>
	<interface name="org.freedesktop.DBus">
		<method name="ListNames">
			<arg direction="out" type="as"/>
		</method>
	</interface>
</node>`

let indicator = null;

function enable(){
	indicator = new MprisLabel();
}

function disable(){
	indicator.disable();
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

		this.buttonText = new St.Label({
			text: "",
			style: "padding-left: " + LEFT_PADDING + "px;"
			+ "padding-right: " + RIGHT_PADDING + "px; ",
			y_align: Clutter.ActorAlign.CENTER,
			x_align: Clutter.ActorAlign.FILL
		});
		this.add_child(this.buttonText);
		this.connect('button-press-event',this._cyclePlayers.bind(this));

		this.settings.connect('changed::left-padding',this._onPaddingChanged.bind(this));
		this.settings.connect('changed::right-padding',this._onPaddingChanged.bind(this));
		this.settings.connect('changed::extension-index',this._updateTrayPosition.bind(this));
		this.settings.connect('changed::extension-place',this._updateTrayPosition.bind(this));

		Main.panel.addToStatusArea('Mpris Label',this,EXTENSION_INDEX,EXTENSION_PLACE);

		this.player = null;
		this.activePlayers = null;

		let dBusList = getDBusList();
		this.playerList = [];
                dBusList.forEach(element => {
				this.playerList.push(new Player(element));
                });

		this._refresh();
	}

	_cyclePlayers(){
		this._updatePlayerList();

		if(this.playerList.length < 2)
			return
		
		if(this.playerList.indexOf(this.player) == this.playerList.length - 1){
			this.player = this.playerList[0];
			return
		}
		this.player = this.playerList[this.playerList.indexOf(this.player)+1];
	}

	_onPaddingChanged(){
		LEFT_PADDING = this.settings.get_int('left-padding');
		RIGHT_PADDING = this.settings.get_int('right-padding');
		this.buttonText.set_style("padding-left: " + LEFT_PADDING + "px;"
		+ "padding-right: " + RIGHT_PADDING + "px; ");
	}

	_updateTrayPosition(){
		EXTENSION_PLACE = this.settings.get_string('extension-place');
		EXTENSION_INDEX = this.settings.get_int('extension-index');

		this.container.get_parent().remove_actor(this.container);

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
		MAX_STRING_LENGTH = this.settings.get_int('max-string-length');
		REFRESH_RATE = this.settings.get_int('refresh-rate');
		BUTTON_PLACEHOLDER = this.settings.get_string('button-placeholder');
		REMOVE_REMASTER_TEXT = this.settings.get_boolean('remove-remaster-text');
		DIVIDER_STRING = this.settings.get_string('divider-string');
		FIRST_FIELD = this.settings.get_string('first-field');
		SECOND_FIELD = this.settings.get_string('second-field');
		LAST_FIELD = this.settings.get_string('last-field');
		REMOVE_TEXT_WHEN_PAUSED = this.settings.get_boolean('remove-text-when-paused');
		AUTO_SWITCH_TO_MOST_RECENT = this.settings.get_boolean('auto-switch-to-most-recent');

		this._updatePlayerList();
		this._pickPlayer();
		this._setText();
		
		this._removeTimeout();
		
		this._timeout = Mainloop.timeout_add(REFRESH_RATE, Lang.bind(this, this._refresh));
		return true;
	}

	_updatePlayerList(){
		let dBusList = getDBusList();
		let addresses = [];

		this.playerList.forEach(player => {
			if (dBusList.includes(player.address)){
				player.update();
				addresses.push(player.address);
			}
			else {
				this.playerList.splice(playerList.indexOf(player),1);
			}
		});

		dBusList.forEach(address => {
			if(!addresses.includes(address))
				this.playerList.push(new Player(address));
		});

		this.activePlayers = [];
		this.playerList.forEach(player => {
			if(player.playbackStatus == "Playing")
				this.activePlayers.push(player);
		});

        }

	_pickPlayer(){
		if(this.playerList.includes(this.player) && !AUTO_SWITCH_TO_MOST_RECENT)
			return

		let bestChoice = this.playerList.at(-1);

		if(!this.activePlayers || this.activePlayers.length == 0)
			return

		let winner = 0;
		this.activePlayers.forEach(player => {
			if(player.statusTimestamp > winner){
				winner = player.statusTimestamp;
				bestChoice = player;
			}
		});
		this.player = bestChoice;
	}

	_setText() {
		try{
			if (!this.playerList[0]){
				this.buttonText.set_text("");
				return
			}

			if ( (!this.activePlayers || this.activePlayers.length == 0) && REMOVE_TEXT_WHEN_PAUSED){
				this.buttonText.set_text("");
				return
			}

			this.buttonText.set_text(this._buildLabel());
		}
		catch(err){
			log("Mpris Label: " + err);
			this.buttonText.set_text("");
		}
	}

	_buildLabel(){
		let labelstring = "";

		if(!(REMOVE_TEXT_WHEN_PAUSED && this.player.playbackStatus == "Paused")){
		
		labelstring =
			getMetadata(this.player.address,FIRST_FIELD)+
			getMetadata(this.player.address,SECOND_FIELD)+
			getMetadata(this.player.address,LAST_FIELD);
		labelstring =
			labelstring.substring(0,labelstring.length - DIVIDER_STRING.length);
		}

		if( (this.playerList.length > 1) && (labelstring.length == 0) ){
			if (this.activePlayers.length == 0)
				return ""

			return BUTTON_PLACEHOLDER
		}
	
		return labelstring
	}

	_removeTimeout() {
		if (this._timeout) {
			Mainloop.source_remove(this._timeout);
			this._timeout = null;
		}
	}

	disable(){
		this.remove_child(this.buttonText);
		this.player = null;
		this._removeTimeout();
		this.destroy();
	}
}
);

class Player {
        constructor(address){
                this.address = address;
                this.playbackStatus = getPlayerStatus(address);
                this.statusTimestamp = new Date().getTime();
        }
        update(){
                let playbackStatus = getPlayerStatus(this.address);

                if(this.playbackStatus != playbackStatus){
                        this.playbackStatus = playbackStatus;
                        this.statusTimestamp = new Date().getTime();
                }
        }
}

function getMetadata(address,field){
		let metadataWrapper = Gio.DBusProxy.makeProxyWrapper(playerInterface);
		let metadataProxy = metadataWrapper(Gio.DBus.session,address, "/org/mpris/MediaPlayer2");
		let metadataField = "";
		if(field == "")
			return metadataField
		try{
			if(field == "xesam:artist")
				metadataField = parseMetadataField(metadataProxy.Metadata[field].get_strv()[0]);
			else
				metadataField = parseMetadataField(metadataProxy.Metadata[field].get_string()[0]);
		}
		finally{
			return metadataField
		}
}

function getDBusList(){
	let dBusProxyWrapper = Gio.DBusProxy.makeProxyWrapper(dBusInterface);
	let dBusProxy = dBusProxyWrapper(Gio.DBus.session,"org.freedesktop.DBus","/org/freedesktop/DBus");
	let dBusList = dBusProxy.ListNamesSync()[0];
	return dBusList.filter(element => element.startsWith("org.mpris.MediaPlayer2"));
}

function getPlayerStatus(playerAddress) {
	let statusWrapper = Gio.DBusProxy.makeProxyWrapper(statusInterface);
	let statusProxy = statusWrapper(Gio.DBus.session,playerAddress, "/org/mpris/MediaPlayer2");
	return statusProxy.PlaybackStatus;
}

function parseMetadataField(data) {
	if (data.length == 0)
		return ""

	if (data.includes("xesam:") || data.includes("mpris:"))
		return ""
	
	//Replaces every instance of " | "
	if(data.includes(" | "))
		data = data.replace(/ \| /g, " / ");

	if(data.match(/Remaster/i))
		data = removeRemasterText(data);

	//Cut string if it's longer than MAX_STRING_LENGTH, preferably in a space
	if (data.length > MAX_STRING_LENGTH){
		data = data.substring(0, MAX_STRING_LENGTH);
		let lastIndex = data.lastIndexOf(" ");
		if(lastIndex == -1)
			lastIndex = data.length;

		data = data.substring(0, lastIndex) + "...";
	}

	data += DIVIDER_STRING;

	return data
}

function removeRemasterText(datastring) {
	if(!REMOVE_REMASTER_TEXT)
		return datastring
		
	let matchedSubString = datastring.match(/\((.*?)\)/gi); //matches text between parentheses

	if (!matchedSubString)
		matchedSubString = datastring.match(/-(.*?)$/gi); //matches text between a hyphen(-) and the end of the string

	if (!matchedSubString)
		return datastring //returns <datastring> unaltered if both matches were not successful

	if(!matchedSubString[0].match(/Remaster/i))
		return datastring //returns <datastring> unaltered if our match doesn't contain 'remaster'

	datastring = datastring.replace(matchedSubString[0],"");

	if (datastring.charAt(datastring.length-1) == " ")
		datastring = datastring.substring(0,datastring.length-1); 

	return datastring
}
