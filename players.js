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
		<signal name="NameOwnerChanged">
			<arg direction="out" type="s"/>
			<arg direction="out" type="s"/>
			<arg direction="out" type="s"/>
		</signal>
	</interface>
</node>`

var Players = class Players {
	constructor(){
		this.list = [];
		this.activePlayers= [];
		const dBusProxyWrapper = Gio.DBusProxy.makeProxyWrapper(dBusInterface);
		this.dBusProxy = dBusProxyWrapper(Gio.DBus.session,"org.freedesktop.DBus","/org/freedesktop/DBus",this._initList.bind(this));
		this.settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');
	}
	pick(){
		const REMOVE_TEXT_WHEN_PAUSED = this.settings.get_boolean('remove-text-when-paused');
		const AUTO_SWITCH_TO_MOST_RECENT = this.settings.get_boolean('auto-switch-to-most-recent');

		if(this.list.length == 0){
			this.selected = null;
			return this.selected
		}

		if(!this.list.includes(this.selected))
			this.selected = null

		if(this.list.includes(this.selected) && !AUTO_SWITCH_TO_MOST_RECENT)
			return this.selected

		let newestTimestamp = 0;
		let bestChoice = this.list[0];
		let list = this.list;

		if(AUTO_SWITCH_TO_MOST_RECENT){
			if(this.activePlayers.length == 0)
				return this.selected

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
	_initList(){
		let dBusList = this.dBusProxy.ListNamesSync()[0];
		dBusList = dBusList.filter(element => element.startsWith("org.mpris.MediaPlayer2"));

		this.unfilteredList = [];
		dBusList.forEach(address => this.unfilteredList.push(new Player(address)));

		this.dBusProxy.connectSignal('NameOwnerChanged',this._updateList.bind(this));
	}
	_updateList(proxy, sender, [name,oldOwner,newOwner]){
		if(name.startsWith("org.mpris.MediaPlayer2")){
			if(newOwner && !oldOwner){ //add player
				let player = new Player(name);
				this.unfilteredList.push(player);
			}
			else if (!newOwner && oldOwner){ //delete player
				this.unfilteredList = this.unfilteredList.filter(player => player.address != name);
			}
		}
	}
	updateFilterList(){
		if(!this.unfilteredList)
			return

		const SOURCES_BLACKLIST = this.settings.get_string('mpris-sources-blacklist');
		const SOURCES_WHITELIST = this.settings.get_string('mpris-sources-whitelist');
		let USE_WHITELIST = this.settings.get_boolean('use-whitelisted-sources-only');

		if(!SOURCES_BLACKLIST || !SOURCES_WHITELIST)
			this.list = this.unfilteredList;

		const blacklist = SOURCES_BLACKLIST.toLowerCase().replaceAll(' ','').split(',');
		const whitelist = SOURCES_WHITELIST.toLowerCase().replaceAll(' ','').split(',');

		if(USE_WHITELIST && SOURCES_WHITELIST)
			this.list = this.unfilteredList.filter(element => whitelist.includes(element.identity.toLowerCase().replaceAll(' ','')));

		if(!USE_WHITELIST && SOURCES_BLACKLIST)
			this.list = this.unfilteredList.filter(element => !blacklist.includes(element.identity.toLowerCase().replaceAll(' ','')));
	}
	updateActiveList(){
		let actives = [];
		this.list.forEach(player => {
			if(player.playbackStatus == "Playing")
				actives.push(player);
		});
		this.activePlayers = actives;
	}
}

class Player {
	constructor(address){
		this.address = address;
		this.statusTimestamp = new Date().getTime();

		const proxyWrapper = Gio.DBusProxy.makeProxyWrapper(mprisInterface);
		this.proxy = proxyWrapper(Gio.DBus.session,this.address, "/org/mpris/MediaPlayer2",this.update.bind(this));
		this.proxy.connect('g-properties-changed', this.update.bind(this));

		const entryWrapper = Gio.DBusProxy.makeProxyWrapper(entryInterface);
		this.entryProxy = entryWrapper(Gio.DBus.session,this.address, "/org/mpris/MediaPlayer2",this._onEntryProxyReady.bind(this));

	}
	_onEntryProxyReady(){
		this.identity = this.entryProxy.Identity;
		this.desktopEntry = this.entryProxy.DesktopEntry;

		this.desktopApp = null;
		let matchedEntries = [];
		if(! (this.identity == null | undefined))
			matchedEntries = Gio.DesktopAppInfo.search(this.identity);

		if ( matchedEntries.length === 0 && !(this.desktopEntry == null | undefined) )//backup method using DesktopEntry info
			matchedEntries = Gio.DesktopAppInfo.search(this.desktopEntry);

		//de-nest matchedEntries. Gio.DesktopAppInfo.search returns a nested array
		let entries = [];
		matchedEntries.forEach(nest => {
			nest.forEach(entry => {
				entries.push(entry);
			});
		});
		matchedEntries = entries;

		if ( matchedEntries.length > 0 )
			this.desktopApp = this._matchRunningApps(matchedEntries)

		this.icon = this.getIcon(this.desktopApp);
	}
	_matchRunningApps(matchedEntries){
		const activeApps = Shell.AppSystem.get_default().get_running();

		const match = matchedEntries.find(entry => {
			let playerObject = Shell.AppSystem.get_default().lookup_app(entry);
			return activeApps.includes(playerObject)
		});

		if(match)
			return match

		return matchedEntries[0]
	}
	update(){
		this.metadata = this.proxy.Metadata;

		let playbackStatus = this.proxy.PlaybackStatus;

		if(this.playbackStatus != playbackStatus){
			this.playbackStatus = playbackStatus;
			this.statusTimestamp = new Date().getTime();
		}
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

		let entry = Gio.DesktopAppInfo.new(desktopApp);
		let gioIcon = entry.get_icon();
		icon.set_gicon(gioIcon);
		return icon
	}
	toggleStatus() {
		if (this.proxy.CanPlay && this.proxy.CanPause)
			this.proxy.PlayPauseRemote()
	}
	goNext(){
		if (this.proxy.CanGoNext)
			this.proxy.NextRemote()
	}
	goPrevious(){
		if (this.proxy.CanGoPrevious)
			this.proxy.PreviousRemote()
	}
	activatePlayer(){
		if(this.desktopApp){
			let app = Shell.AppSystem.get_default().lookup_app(this.desktopApp);
			let focused_window = global.display.get_focus_window();

			if (this.player_window == null || focused_window != this.player_window){//activate player
				if (this.player_window)//only able to record status once window is known
					this.player_window_minimized = this.player_window.minimized
				else {
					let window = this._guessAppWindow(this.identity);
					if (window)
						this.player_window_minimized = window.minimized;
				}

				app.activate();
				this.player_window = global.display.get_focus_window();
				return
			}

			if (this.player_window_minimized)
				this.player_window.minimize();

			// equivalent to Alt+tab. window to be focused is at the end of the list, just before player and Gnome-shell
			let windows_list = global.get_window_actors();
			let app_window = windows_list[windows_list.length - 3].get_meta_window(); 
			app_window.activate(global.get_current_time());
		}
	}
	_guessAppWindow(identity){//secondary best-guess method to match player with window
		identity = identity.toLowerCase();
		for (const actor of global.get_window_actors()) {
			const window = actor.get_meta_window();
			let wm_class = window.get_wm_class().toLowerCase();
			if (wm_class.includes(identity) | identity.includes(wm_class))
				return window;
		}
	}
}

