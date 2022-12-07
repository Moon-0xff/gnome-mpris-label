const {Gio,GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');
const CurrentExtension = ExtensionUtils.getCurrentExtension();

const { getIcon } = CurrentExtension.imports.icons;

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

let REMOVE_TEXT_WHEN_PAUSED = settings.get_boolean('remove-text-when-paused');
let REMOVE_TEXT_PAUSED_DELAY = settings.get_int('remove-text-paused-delay');
let AUTO_SWITCH_TO_MOST_RECENT = settings.get_boolean('auto-switch-to-most-recent');

var PlayersHandler = class PlayersHandler {
	constructor(){
		this.playerList = [];
		this.removeTextPausedDelayStamp = null;
		this.removeTextPlayerTimestamp = 0;
	}
	pickPlayer(){
		this._updatePlayerList();

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

		if(AUTO_SWITCH_TO_MOST_RECENT)
			this.activePlayers = this.playerList.filter(element => element.playbackStatus == "Playing")
	}
	removeTextPausedIsActive(){
		if (REMOVE_TEXT_PAUSED_DELAY <= 0){
			this.player.removeTextIsActive = true;
			return
		}

		if (this.player.statusTimestamp != this.removeTextPlayerTimestamp && this.removeTextPausedDelayStamp == null){
			this.removeTextPausedDelayStamp = new Date().getTime() / 1000;
			this.player.removeTextIsActive = false;
			return
		}

		let timeNow = new Date().getTime() / 1000;
		if(this.removeTextPausedDelayStamp + REMOVE_TEXT_PAUSED_DELAY <= timeNow){
			this.removeTextPausedDelayStamp = null;
			this.removeTextPlayerTimestamp = this.player.statusTimestamp;
			this.player.removeTextIsActive = true;
			return
		}
		this.player.removeTextIsActive = false;
	}
}

class Player {
	constructor(address){
		this.address = address;
		this.statusTimestamp = new Date().getTime();
		this.icon = getIcon(address);

		const proxyWrapper = Gio.DBusProxy.makeProxyWrapper(mprisInterface);
		this.proxy = proxyWrapper(Gio.DBus.session,this.address, "/org/mpris/MediaPlayer2");

		if(REMOVE_TEXT_WHEN_PAUSED || AUTO_SWITCH_TO_MOST_RECENT)
			this.playbackStatus = this.getStatus();
	}
	update(){
		if(REMOVE_TEXT_WHEN_PAUSED || AUTO_SWITCH_TO_MOST_RECENT){
			let playbackStatus = this.getStatus();

			if(this.playbackStatus != playbackStatus){
				this.playbackStatus = playbackStatus;
				this.statusTimestamp = new Date().getTime();
			}
		}
	}
	getMetadata(){
		let start_time = new Date().getTime();
		let metadata = this.proxy.Metadata;
		let end_time = new Date().getTime(); step = end_time - start_time; log("mpris-label - metadata ("+this.address.substring(23)+"):"+step+"ms");
		return metadata
	}
	getStatus() {
		let start_time = new Date().getTime();
		let playbackStatus = this.proxy.PlaybackStatus
		let end_time = new Date().getTime(); step = end_time - start_time; log("mpris-label - playbackStatus:("+this.address.substring(23)+"): "+step+"ms ("+playbackStatus+")");
		return playbackStatus
	}
}

function getDBusList(){
	let dBusProxyWrapper = Gio.DBusProxy.makeProxyWrapper(dBusInterface); 
	let start_time = new Date().getTime();
	let dBusProxy = dBusProxyWrapper(Gio.DBus.session,"org.freedesktop.DBus","/org/freedesktop/DBus");
	let dBusList = dBusProxy.ListNamesSync()[0];
	end_time = new Date().getTime(); step = end_time - start_time; log("mpris-label - dBusList: "+step+"ms");
	return dBusList.filter(element => element.startsWith("org.mpris.MediaPlayer2"));
}

