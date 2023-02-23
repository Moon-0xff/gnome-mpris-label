const Main = imports.ui.main;
const {Clutter,Gio,GLib,GObject,Shell,St} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const CurrentExtension = ExtensionUtils.getCurrentExtension();

const mprisInterface = `
<node>
	<interface name="org.mpris.MediaPlayer2.Player">
		<method name="PlayPause" />
		<method name="Next" />
		<method name="Previous" />
		<property name="CanPlay" type="b" access="read" />
		<property name="CanPause" type="b" access="read" />
		<property name="CanGoNext" type="b" access="read" />
		<property name="CanGoPrevious" type="b" access="read" />
		<property name="Metadata" type="a{sv}" access="read"/>
		<property name="PlaybackStatus" type="s" access="read"/>
		<property name="Volume" type="d" access="readwrite"/>
	</interface>
</node>`

const entryInterface = `
<node>
	<interface name="org.mpris.MediaPlayer2">
		<property name="DesktopEntry" type="s" access="read"/>
		<property name="Identity" type="s" access="read"/>
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

			let entryWrapper = Gio.DBusProxy.makeProxyWrapper(entryInterface);
			dBusList = dBusList.filter(function(element){
				let entryProxy = entryWrapper(Gio.DBus.session,element,"/org/mpris/MediaPlayer2");
				let identity = entryProxy.Identity.replace(' ','').toLowerCase();
				if (blacklist.includes(identity) || (!whitelist.includes(identity) && USE_WHITELIST))
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

		const proxyWrapper = Gio.DBusProxy.makeProxyWrapper(mprisInterface);
		this.proxy = proxyWrapper(Gio.DBus.session,this.address, "/org/mpris/MediaPlayer2",this.update.bind(this));

		let entryWrapper = Gio.DBusProxy.makeProxyWrapper(entryInterface);
		let entryProxy = entryWrapper(Gio.DBus.session,this.address,"/org/mpris/MediaPlayer2");
		this.identity = entryProxy.Identity;
		this.desktopEntry = entryProxy.DesktopEntry;

		this.desktopApp = null;
		let matchedEntries = [];
		if(! (this.identity == null | undefined))
			matchedEntries = Gio.DesktopAppInfo.search(this.identity);

		if ( matchedEntries.length === 0 && !(this.desktopEntry == null | undefined) )//backup method using DesktopEntry info
			matchedEntries = Gio.DesktopAppInfo.search(this.desktopEntry)
		
		if ( matchedEntries.length > 0 )
			this.desktopApp = matchedEntries[0][0]

		this.icon = this.getIcon(this.desktopApp);

		this.proxy.connect('g-properties-changed', this._onPropertiesChanged.bind(this));

		setTimeout(() => { //some players returns null if probed too quickly
			this.metadata = this.getMetadata();
			this.metadataString = this.metadata['xesam:artist'].get_strv()[0]+'_'+this.metadata['xesam:album'].get_string()[0]+'_'+this.metadata['xesam:title'].get_string()[0];

			this.playbackStatus = this.getStatus();

			this.canSetVolume = false; //default
			this.volume = this.proxy.Volume;
			let newVolume = Math.max(0,this.volume-0.0001);
			this.setVolume(newVolume); //apply volume to see if it triggers onPropertiesChanged
			this.volume = newVolume
		}, 2000);
	}
	_onPropertiesChanged(){
		this.propertyChanged = undefined;

		let volume = this.getVolume();
		if (volume !== this.volume && this.volume != undefined && volume != null){
			this.propertyChanged = "Volume";
			// log(Date().substring(16,24)+' gnome-mpris-label/players.js: '+this.identity+' Volume changed');
			this.canSetVolume = true;
			this.volume = volume;
			return
		}

		let playbackStatus = this.getStatus();
		if (this.playbackStatus != playbackStatus){
			this.propertyChanged = "PlaybackStatus";
			// log(Date().substring(16,24)+' gnome-mpris-label/players.js: '+this.identity+' PlaybackStatus changed');
			this.playbackStatus = playbackStatus;
			this.statusTimestamp = new Date().getTime();
			return
		}
		
		let metadata = this.getMetadata();
		let metadataString = metadata['xesam:artist'].get_strv()[0]+'_'+metadata['xesam:album'].get_string()[0]+'_'+metadata['xesam:title'].get_string()[0];
		if (this.metadataString != metadataString){
			this.propertyChanged = "Metadata";
			// log(Date().substring(16,24)+' gnome-mpris-label/players.js: '+this.identity+' Metadata changed');
			this.metadataString = metadataString;
			return
		}

		// log(Date().substring(16,24)+' gnome-mpris-label/players.js: '+this.identity+' Properties changed: '+this.propertyChanged);
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
		let playbackStatus = this.proxy.PlaybackStatus;
		return playbackStatus
	}
	getIcon(desktopApp){
		const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');
		const ICON_PLACE = settings.get_string('show-icon');
		const Config = imports.misc.config;
	
		let icon_left_padding = 0;
		let icon_right_padding = 0;
		if (Config.PACKAGE_VERSION.startsWith("3."))
			if (ICON_PLACE == "right")
				icon_left_padding = 3
			else if (ICON_PLACE == "left")
				icon_right_padding = 3
	
			let icon = new St.Icon({
			style_class: 'system-status-icon',
			fallback_icon_name: 'audio-volume-high',
			style: "padding-left: " + icon_left_padding + "px;padding-right: " + icon_right_padding + "px;"
		});
	
		if(desktopApp == null | undefined)
			return icon
	
		let entry = Shell.AppSystem.get_default().lookup_app(desktopApp);

		let gioIcon = entry.get_icon();
		entry.launch;
		icon.set_gicon(gioIcon);
		return icon
	}
	toggleStatus() {
		if (this.proxy.CanPlay && this.proxy.CanPause)
			this.proxy.PlayPauseRemote()
		else
			displayError("Play/Pause control not available")
	}
	goNext(){
		if (this.proxy.CanGoNext)
			this.proxy.NextRemote()
		else
			displayError("Go Next control not available")
	}
	goPrevious(){
		if (this.proxy.CanGoPrevious)
			this.proxy.PreviousRemote()
		else
			displayError("Go Previous control not available")
	}
	getVolume() {
		return this.proxy.Volume
	}
	setVolume(volume){
		this.proxy.Volume = volume
	}
	getVolumeEnabled(){
		return this.canSetVolume
	}
	displayError(text){
		const monitor = global.display.get_current_monitor();
		const icon = Gio.Icon.new_for_string('dialog-error-symbolic');
		text = text+' on ' + this.shortname;
		Main.osdWindowManager.show(monitor,icon,text,0);
	}
}

