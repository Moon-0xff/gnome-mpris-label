const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const {Clutter,Gio,GLib,GObject,St} = imports.gi;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;

let LEFT_PADDING,RIGHT_PADDING,MAX_STRING_LENGTH,EXTENSION_INDEX,
	EXTENSION_PLACE,REFRESH_RATE,BUTTON_PLACEHOLDER,
	REMOVE_REMASTER_TEXT,DIVIDER_STRING,FIRST_FIELD,SECOND_FIELD,
<<<<<<< HEAD
	LAST_FIELD,REMOVE_TEXT_WHEN_PAUSED,REMOVE_TEXT_PAUSED_DELAY,
	AUTO_SWITCH_TO_MOST_RECENT;
=======
	LAST_FIELD,REMOVE_TEXT_WHEN_PAUSED;
>>>>>>> b394166 (Update after feedback)

let removeTextPausedDelayStamp = null;
let removeTextPlayerTimestamp = 0;

const mprisInterface = `
<node>
	<interface name="org.mpris.MediaPlayer2.Player">
		<property name="Metadata" type="a{sv}" access="read"/>
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
	indicator._disable();
	indicator.destroy();
	indicator = null;
}

var MprisLabel = GObject.registerClass(
	{ GTypeName: 'MprisLabel' },
class MprisLabel extends PanelMenu.Button {
	_init(){
		super._init(0.0,'Mpris Label',false);

		this.ui = new Map();
		this.settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');
		LEFT_PADDING = this.settings.get_int('left-padding');
		RIGHT_PADDING = this.settings.get_int('right-padding');
		EXTENSION_INDEX = this.settings.get_int('extension-index');
		EXTENSION_PLACE = this.settings.get_string('extension-place');

		const box = new St.BoxLayout({
			style_class: "panel-status-menu-box",
		});
		this.ui.set("box", box);

		this.ui.set("label", this.makeLabel());

		this.ui.set("icon", this.makeIcon("spotify")); //works also with "firefox" and "google-chrome"

		box.add_child(this.ui.get("icon"));
		box.add_child(this.ui.get("label"));
		this.ui.get("label").set_text("hello");
		this.add_child(box);
		this._onPaddingChanged(); //set padding

		this.ui.get("label").set_text("world"); //changes the text
		this.ui.get("icon", this.makeIcon("firefox")); //doesn't change the icon... need to find correct code to change icon dynamically

		this.connect('button-press-event',this._cyclePlayers.bind(this));

		this.settings.connect('changed::left-padding',this._onPaddingChanged.bind(this));
		this.settings.connect('changed::right-padding',this._onPaddingChanged.bind(this));
		this.settings.connect('changed::extension-index',this._updateTrayPosition.bind(this));
		this.settings.connect('changed::extension-place',this._updateTrayPosition.bind(this));

		Main.panel.addToStatusArea('Mpris Label',this,EXTENSION_INDEX,EXTENSION_PLACE);

		this.playerList = [];

		this._refresh();
	}

	makeLabel(){
		return new St.Label({
			text: "",
			y_align: Clutter.ActorAlign.CENTER,
			x_align: Clutter.ActorAlign.FILL
		});
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
	}

	_onPaddingChanged(){
		LEFT_PADDING = this.settings.get_int('left-padding');
		RIGHT_PADDING = this.settings.get_int('right-padding');
		//this.ui.set_style("padding-left: " + LEFT_PADDING + "px;"
		//+ "padding-right: " + RIGHT_PADDING + "px; ");
		this.ui.get("icon").set_style("padding-left: " + LEFT_PADDING + "px;");
		this.ui.get("label").set_style("padding-right: " + RIGHT_PADDING + "px; ");
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
		MAX_STRING_LENGTH = this.settings.get_int('max-string-length');
		REFRESH_RATE = this.settings.get_int('refresh-rate');
		BUTTON_PLACEHOLDER = this.settings.get_string('button-placeholder');
		REMOVE_REMASTER_TEXT = this.settings.get_boolean('remove-remaster-text');
		DIVIDER_STRING = this.settings.get_string('divider-string');
		FIRST_FIELD = this.settings.get_string('first-field');
		SECOND_FIELD = this.settings.get_string('second-field');
		LAST_FIELD = this.settings.get_string('last-field');
		REMOVE_TEXT_WHEN_PAUSED = this.settings.get_boolean('remove-text-when-paused');
<<<<<<< HEAD
		REMOVE_TEXT_PAUSED_DELAY = this.settings.get_int('remove-text-paused-delay');
		AUTO_SWITCH_TO_MOST_RECENT = this.settings.get_boolean('auto-switch-to-most-recent');

		this._updatePlayerList();
		this._pickPlayer();
		this._setText();
		
		this.ui.get("icon", this.makeIcon("google-chrome"));
=======
>>>>>>> b394166 (Update after feedback)

		this._removeTimeout();
		
		this._timeout = Mainloop.timeout_add(REFRESH_RATE, Lang.bind(this, this._refresh));
		return true;
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

		this.activePlayers = this.playerList.filter(element => element.playbackStatus == "Playing");
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
			if(this.activePlayers.length == 0)
				return
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

<<<<<<< HEAD
	_setText() {
		try{
			if(this.player == null || undefined)
				this.ui.get("label").set_text("");
			else
				this.ui.get("label").set_text(this._buildLabel());
=======
			if(!this.playerList.includes(this.player.address))
				this.player.changeAddress(this.playerList[0]);

            this.status= new Status(this.playerList[0]);

            this.buttonText.set_text(this._buildLabel());
			
>>>>>>> b394166 (Update after feedback)
		}
		catch(err){
			log("Mpris Label: " + err);
			this.ui.get("label").set_text("");
		}
	}

	_buildLabel(){
<<<<<<< HEAD
		if(REMOVE_TEXT_WHEN_PAUSED && this.player.playbackStatus != "Playing"){
			if(removeTextPausedIsActive(this.player)){
				if(this.activePlayers.length == 0)
					return ""
				return BUTTON_PLACEHOLDER
			}
		}
=======
	    if( (this.status.getStatus() == "Paused") && (REMOVE_TEXT_WHEN_PAUSED) )
	        return
	
		let labelstring = 
			this.player.getMetadata(FIRST_FIELD)+
			this.player.getMetadata(SECOND_FIELD)+
			this.player.getMetadata(LAST_FIELD);
>>>>>>> b394166 (Update after feedback)

		let labelstring =
			getMetadata(this.player.address,FIRST_FIELD)+
			getMetadata(this.player.address,SECOND_FIELD)+
			getMetadata(this.player.address,LAST_FIELD);

		labelstring =
			labelstring.substring(0,labelstring.length - DIVIDER_STRING.length);

		if(labelstring.length == 0){
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

	makeIcon(app_name) {
		const snapFileContents = this.readSnapFile(app_name);
		if (snapFileContents) {
			// There's a snap build of Spotify installed
			const gicon = Gio.icon_new_for_string(snapFileContents);
			return new St.Icon({
				gicon,
				style_class: "system-status-icon",
				y_align: Clutter.ActorAlign.CENTER,
			});
		}
		return new St.Icon({
			icon_name: app_name,
			style_class: "system-status-icon",
			fallback_icon_name: "com."+app_name+".Client", // icon name for flatpak, in case it's not a native build
		});
	}

	readSnapFile(app_name) {
		try {
			const [ok, contents] = GLib.file_get_contents(
				"/var/lib/snapd/desktop/applications/"+app_name+"_"+app_name+".desktop",
			);
			if (!ok) {
				return false;
			}
			const matched = String.fromCharCode(...contents).match(/Icon=(.*)\n/m);
			return matched ? matched[1] : false;
		} catch (error) {
			return false;
		}
	}

	_disable(){
		this.ui.get("box").destroy();
		//this.remove_child(this.buttonText);
		this._removeTimeout();
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
		let metadataWrapper = Gio.DBusProxy.makeProxyWrapper(mprisInterface);
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
	let statusWrapper = Gio.DBusProxy.makeProxyWrapper(mprisInterface);
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

function removeTextPausedIsActive(player){
	if (REMOVE_TEXT_PAUSED_DELAY <= 0){
		return true
	}

	if (player.statusTimestamp != removeTextPlayerTimestamp && removeTextPausedDelayStamp == null){
		removeTextPausedDelayStamp = new Date().getTime() / 1000;
		return false
	}

	let timeNow = new Date().getTime() / 1000;
	if(removeTextPausedDelayStamp + REMOVE_TEXT_PAUSED_DELAY <= timeNow){
		removeTextPausedDelayStamp = null;
		removeTextPlayerTimestamp = player.statusTimestamp;
		return true
	}
	return false
}

