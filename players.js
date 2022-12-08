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

var Players = class Players {
	constructor(){
		this.list = [];
		const dBusProxyWrapper = Gio.DBusProxy.makeProxyWrapper(dBusInterface);
		this.dBusProxy = dBusProxyWrapper(Gio.DBus.session,"org.freedesktop.DBus","/org/freedesktop/DBus");
	}
	pick(){
		this._updateList();

		if(this.list.length == 0){
			this.player = null;
			return;
		}

		if(this.list.includes(this.player) && !AUTO_SWITCH_TO_MOST_RECENT)
			return

		let newestTimestamp = 0;
		let bestChoice = this.list[0];
		let list = this.list;

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
	next(){
		this._updateList();

		let list = this.list;

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
	_updateList(){
		const start_time = new Date().getTime();
		let dBusList = this.dBusProxy.ListNamesSync()[0];
		const end_time = new Date().getTime(); const step = end_time - start_time; log("mpris-label - dBusList: "+step+"ms");
		dBusList = dBusList.filter(element => element.startsWith("org.mpris.MediaPlayer2"));

		this.list = this.list.filter(element => dBusList.includes(element.address));

		let addresses = [];
		this.list.forEach(element => {
			element.update();
			addresses.push(element.address);
		});

		let newPlayers = dBusList.filter(element => !addresses.includes(element));
		newPlayers.forEach(element => this.list.push(new Player(element)));

		if(AUTO_SWITCH_TO_MOST_RECENT)
			this.activePlayers = this.playerList.filter(element => element.playbackStatus == "Playing")
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
		const start_time = new Date().getTime();
		let metadata = this.proxy.Metadata;
		const end_time = new Date().getTime(); const step = end_time - start_time; log("mpris-label - metadata ("+this.address.substring(23)+"):"+step+"ms");
		return metadata
	}
	getStatus() {
		const start_time = new Date().getTime();
		let playbackStatus = this.proxy.PlaybackStatus
		const end_time = new Date().getTime(); const step = end_time - start_time; log("mpris-label - playbackStatus:("+this.address.substring(23)+"): "+step+"ms ("+playbackStatus+")");
		return playbackStatus
	}
}

