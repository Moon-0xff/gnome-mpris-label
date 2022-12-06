const {Gio,GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');

let FIRST_FIELD,SECOND_FIELD,LAST_FIELD,MAX_STRING_LENGTH,DIVIDER_STRING;

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

var PlayersHandler = class PlayersHandler {
	constructor(){
		this.playerList = [];
	}
	updatePlayerList(){
		let dBusList = getDBusList();

		this.playerList = this.playerList.filter(element => dBusList.includes(element.address));

		let addresses = [];
		this.playerList.forEach(element => {
			element.update();
			addresses.push(element.address);
		});

		let newPlayers = dBusList.filter(element => !addresses.includes(element));
		newPlayers.forEach(element => this.playerList.push(new Player(element)));

		if(AUTO_SWITCH_TO_MOST_RECENT)
			this.activePlayers = this.playerList.filter(element => element.playbackStatus == "Playing")
	}
	pickPlayer(){
		if(this.playerList.length == 0){
			this.player = null;
			return;
		}

		if(this.playerList.includes(this.player) && !AUTO_SWITCH_TO_MOST_RECENT)
			return

		let newestTimestamp = 0;
		let bestChoice = this.playerList[0];
		let list = this.playerList;

		if(AUTO_SWITCH_TO_MOST_RECENT){
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
	cyclePlayers(){
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

		if(AUTO_SWITCH_TO_MOST_RECENT){
			this.player.statusTimestamp = new Date().getTime();
		}
	}
}

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

var getDBusList = function getDBusList(){
	let dBusProxyWrapper = Gio.DBusProxy.makeProxyWrapper(dBusInterface); 
	let start_time = new Date().getTime();
	let dBusProxy = dBusProxyWrapper(Gio.DBus.session,"org.freedesktop.DBus","/org/freedesktop/DBus");
	end_time = new Date().getTime(); step = end_time - start_time; log("mpris-label - dBusList: "+step+"ms");
	let dBusList = dBusProxy.ListNamesSync()[0];
	end_time = new Date().getTime();
	return dBusList.filter(element => element.startsWith("org.mpris.MediaPlayer2"));
}

var getPlayerStatus = function getPlayerStatus(playerAddress) {
	let statusWrapper = Gio.DBusProxy.makeProxyWrapper(mprisInterface);
	let start_time = new Date().getTime();
	let statusProxy = statusWrapper(Gio.DBus.session,playerAddress, "/org/mpris/MediaPlayer2");
	end_time = new Date().getTime(); step = end_time - start_time; log("mpris-label - playbackStatus:("+playerAddress.substring(23)+"): "+step+"ms ("+statusProxy.PlaybackStatus+")");
	return statusProxy.PlaybackStatus;
}

var getMetadata = function getMetadata(address){
		FIRST_FIELD = settings.get_string('first-field');
		SECOND_FIELD = settings.get_string('second-field');
		LAST_FIELD = settings.get_string('last-field');

		let metadata = "";

		let metadataWrapper = Gio.DBusProxy.makeProxyWrapper(mprisInterface);
		let start_time = new Date().getTime();
		let metadataProxy = metadataWrapper(Gio.DBus.session,address, "/org/mpris/MediaPlayer2");
		end_time = new Date().getTime(); step = end_time - start_time; log("mpris-label - metadata ("+address.substring(23)+"):"+step+"ms");
		try{
			let fields = [FIRST_FIELD,SECOND_FIELD,LAST_FIELD];
			fields.forEach(field => {
				if(field == "xesam:artist")
					metadata = metadata + parseMetadataField(metadataProxy.Metadata[field].get_strv()[0]);
				else
					metadata = metadata + parseMetadataField(metadataProxy.Metadata[field].get_string()[0]);
			});
		}
		finally{
			return metadata
		}
}

removeTextPausedIsActive(player){
	if (REMOVE_TEXT_PAUSED_DELAY <= 0){
		return true
	}

	if (player.statusTimestamp != this.removeTextPlayerTimestamp && this.removeTextPausedDelayStamp == null){
		this.removeTextPausedDelayStamp = new Date().getTime() / 1000;
		return false
	}

	let timeNow = new Date().getTime() / 1000;
	if(this.removeTextPausedDelayStamp + REMOVE_TEXT_PAUSED_DELAY <= timeNow){
		this.removeTextPausedDelayStamp = null;
		this.removeTextPlayerTimestamp = player.statusTimestamp;
		return true
	}
	return false
}
