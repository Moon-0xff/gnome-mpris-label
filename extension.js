const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const {Clutter,Gio,GLib,St} = imports.gi;
const Mainloop = imports.mainloop;
const Lang = imports.lang;

//"User-defined" constants
const LEFT_PADDING = 30;
const RIGHT_PADDING = 30;
const MAX_STRING_LENGTH = 40;
const EXTENSION_INDEX = 2;
const EXTENSION_PLACE = "left";
const REFRESH_RATE = 300;

class MprisLabel {
	constructor(){
		this._indicator = null;
	}

	enable() {
		this._indicator = new PanelMenu.Button(0.0,'Mpris Label',false);
		this.buttonText = new St.Label({
			text: "",
			style: "padding-left: " + LEFT_PADDING + "px;"
			+ "padding-right: " + RIGHT_PADDING + "px; ",
			y_align: Clutter.ActorAlign.CENTER,
			x_align: Clutter.ActorAlign.FILL
		});
		this._indicator.add_child(this.buttonText);
		Main.panel.addToStatusArea('Mpris Label',this._indicator,EXTENSION_INDEX,EXTENSION_PLACE);

		this._refresh();
	}

	_refresh() {
		this._loadData();
		this._removeTimeout();
		this._timeout = Mainloop.timeout_add(REFRESH_RATE, Lang.bind(this, this._refresh));
		return true;
	}

	_loadData() {
		try{
			let labelstring = buildLabel();
			this.buttonText.set_text(labelstring);
		}
		catch{
			this.buttonText.set_text("");
		}
	}

	_removeTimeout() {
		if (this._timeout) {
			Mainloop.source_remove(this._timeout);
			this._timeout = null;
		}
	}

	disable(){
		this._indicator.destroy();
		this._indicator = null;
		this._removeTimeout();
	}
}

function init(){
	return new MprisLabel();
}

function buildLabel() {
	let player = getPlayer();

	let title = getMetadataField(player,"xesam:title");
	let artist = getMetadataField(player,"xesam:artist");
	let album = getMetadataField(player,"xesam:album");

	let labelstring = artist + album + title;
	labelstring = labelstring.substring(0,labelstring.length-3);

	return labelstring
}

function getPlayer () {
	let dBusInterface = `
	<node>
		<interface name="org.freedesktop.DBus">
			<method name="ListNames">
				<arg direction="out" type="as"/>
			</method>
		</interface>
	</node>
	`
	let dBusProxyWrapper = Gio.DBusProxy.makeProxyWrapper(dBusInterface);
	let dBusProxy = dBusProxyWrapper(Gio.DBus.session,"org.freedesktop.DBus","/org/freedesktop/DBus");
	let dBusList = dBusProxy.ListNamesSync()[0];

	let playerList = [];
	dBusList.forEach(element => {
		if (element.startsWith("org.mpris.MediaPlayer2")){
			playerList.push(element);
		}
	});
	return playerList[0];
}

function getMetadataField(player,field){
	let playerInterface = `
	<node>
		<interface name="org.mpris.MediaPlayer2.Player">
			<property name="Metadata" type="a{sv}" access="read"/>
		</interface>
	</node>`

	let playerProxyWrapper = Gio.DBusProxy.makeProxyWrapper(playerInterface);
	playerProxy = playerProxyWrapper(Gio.DBus.session, player, "/org/mpris/MediaPlayer2");

	if (field == "xesam:artist"){
		return parseMetadataField(playerProxy.Metadata[field].get_strv()[0])
	}

	return parseMetadataField(playerProxy.Metadata[field].get_string()[0])
}

function parseMetadataField(data) {

	if (data.length == 0)
		return ""

	if (data.includes("xesam:") || data.includes("mpris:"))
		return ""
	
	//Replaces every instance of " | "
	if(data.includes(" | "))
		data = data.replace(/ \| /g, " / ");

	//Shorten string if it's longer than 
	if (data.length > MAX_STRING_LENGTH){
		data = data.substring(0, MAX_STRING_LENGTH);
		data = data.substring(0, data.lastIndexOf(" ")) + "...";
	}

	if(data.match(/Remaster/i))
		data = removeRemasterText(data);

	data += " | ";

	return data
}

function removeRemasterText(datastring) {
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