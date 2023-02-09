const {Gio,GObject} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
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

var Players = class Players {
	constructor(){
		this.list = [];
		const dBusProxyWrapper = Gio.DBusProxy.makeProxyWrapper(dBusInterface);
		this.dBusProxy = dBusProxyWrapper(Gio.DBus.session,"org.freedesktop.DBus","/org/freedesktop/DBus");
		this.settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');
	}
	pick(){
		const REMOVE_TEXT_WHEN_PAUSED = this.settings.get_boolean('remove-text-when-paused');
		const AUTO_SWITCH_TO_MOST_RECENT = this.settings.get_boolean('auto-switch-to-most-recent');

		this._updateList();

		if(this.list.length == 0){
			this.selected = null;
			return this.selected
		}

		if(this.list.includes(this.selected) && !AUTO_SWITCH_TO_MOST_RECENT)
			return this.selected

		let newestTimestamp = 0;
		let bestChoice = this.list[0];
		let list = this.list;

		if(AUTO_SWITCH_TO_MOST_RECENT){
			if(this.activePlayers.length == 0){
				if(REMOVE_TEXT_WHEN_PAUSED)
					this.selected = null
					
				return this.selected
			}
			list = this.activePlayers;
		}

		list.forEach(player => {
			if(player.statusTimestamp > newestTimestamp){
				newestTimestamp = player.statusTimestamp;
				bestChoice = player;
			}
		});
		this.selected = bestChoice;
		return this.selected
	}
	next(){
		const AUTO_SWITCH_TO_MOST_RECENT = this.settings.get_boolean('auto-switch-to-most-recent');

		this._updateList();

		let list = this.list;

		if(AUTO_SWITCH_TO_MOST_RECENT)
			list = this.activePlayers;

		if(list.length < 2)
			return this.selected

		let newIndex = list.indexOf(this.selected)+1;

		if(this.selected == list[list.length-1])
			newIndex = 0;

		this.selected = list[newIndex];

		if(AUTO_SWITCH_TO_MOST_RECENT){
			this.selected.statusTimestamp = new Date().getTime();
		}

		return this.selected
	}
	_updateList(){
		let dBusList = this.dBusProxy.ListNamesSync()[0];
		dBusList = dBusList.filter(element => element.startsWith("org.mpris.MediaPlayer2"));

		const SOURCES_BLACKLIST = this.settings.get_string('mpris-sources-blacklist');
		const SOURCES_WHITELIST = this.settings.get_string('mpris-sources-whitelist');

		if(SOURCES_BLACKLIST || SOURCES_WHITELIST){
			let USE_WHITELIST = this.settings.get_boolean('use-whitelisted-sources-only');
			if(SOURCES_BLACKLIST && USE_WHITELIST && !SOURCES_WHITELIST)
				USE_WHITELIST = false;

			const blacklist = SOURCES_BLACKLIST.toLowerCase().replaceAll(' ','').split(',');
			const whitelist = SOURCES_WHITELIST.toLowerCase().replaceAll(' ','').split(',');

			dBusList = dBusList.filter(function(element){
				let source_name = element.replace('org.mpris.MediaPlayer2.','');
				source_name = source_name.replace(/\.instance.*/g,'');
				source_name = source_name.substr(source_name.lastIndexOf(".") + 1);
				source_name = source_name.toLowerCase();
				if (blacklist.includes(source_name) || (!whitelist.includes(source_name) && USE_WHITELIST))
					return false

				return true
			});
		}

		this.list = this.list.filter(element => dBusList.includes(element.address));

		let addresses = [];
		this.list.forEach(element => {
			element.update();
			addresses.push(element.address);
		});

		let newPlayers = dBusList.filter(element => !addresses.includes(element));
		newPlayers.forEach(element => this.list.push(new Player(element)));

		this.activePlayers = this.list.filter(element => element.playbackStatus == "Playing")
	}
}

class Player {
	constructor(address){
		this.address = address;
		this.statusTimestamp = new Date().getTime();
		this.icon = getIcon(address);

		const proxyWrapper = Gio.DBusProxy.makeProxyWrapper(mprisInterface);
		this.proxy = proxyWrapper(Gio.DBus.session,this.address, "/org/mpris/MediaPlayer2",this.update.bind(this));
		
		let shortname = address.replace('org.mpris.MediaPlayer2.','');
		shortname = shortname.replace(/\.instance.*/g,'');
		shortname = shortname.substr(shortname.lastIndexOf(".") + 1);
		shortname = shortname.charAt(0).toUpperCase() + shortname.slice(1);//Capitalise first letter
		this.shortname = shortname;
	}
	update(){
		let playbackStatus = this.getStatus();

		if(this.playbackStatus != playbackStatus){
			this.playbackStatus = playbackStatus;
			this.statusTimestamp = new Date().getTime();
		}
	}
	getMetadata(){
		let metadata = this.proxy.Metadata;
		return metadata
	}
	getStatus() {
		let playbackStatus = this.proxy.PlaybackStatus
		return playbackStatus
	}
}

