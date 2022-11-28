const {Clutter,Gio,GLib,GObject,Shell,St} = imports.gi;
const Panel = imports.ui.panel;

const entryInterface = `
<node>
	<interface name="org.mpris.MediaPlayer2">
		<property name="DesktopEntry" type="s" access="read"/>
	</interface>
</node>`

var fallbackIcon = new St.Icon({
	style_class: 'system-status-icon',
	icon_name: 'rhythmbox'
});

var getIcon = function getIcon(playerAddress){
	if(playerAddress == null | undefined)
		return fallbackIcon

	let bestMatch,DBusAddressMatches,DBusDesktopEntryMatches,playerDesktopEntry;

	// Try to get the desktop entry string from DBus
	try {
		let entryWrapper = Gio.DBusProxy.makeProxyWrapper(entryInterface);
		let entryProxy = entryWrapper(Gio.DBus.session,playerAddress,"/org/mpris/MediaPlayer2");
		playerDesktopEntry = entryProxy.DesktopEntry;
	}
	catch {
		playerDesktopEntry = "";
	}

	// Get the first "element" after org.mpris.MediaPlayer2.Player
	let addressWithoutMPRIS =
		playerAddress.substring(23);

	let firstDot = addressWithoutMPRIS.indexOf(".");

	let suspectAppName =
		addressWithoutMPRIS.substring(0,firstDot);

	// get desktop entries that match suspectAppName
	DBusAddressMatches = matchWithDesktopEntries(suspectAppName);

	// get desktop entries that match playerDesktopEntry
	if (playerDesktopEntry){
		DBusDesktopEntryMatches = matchWithDesktopEntries(playerDesktopEntry);

	guessingGame(DBusAddressMatches,DBusDesktopEntryMatches);
	guessByActiveApps(DBusAddressMatches,DBusDesktopEntryMatches);
	//compare the results of guessingGame and guessByActiveApps or prefer one

	// get the icon name of the best match
	let bestMatchEntry = Gio.DesktopAppInfo.new(bestMatch);
	let themedIcon = bestMatchEntry.get_icon();
	let iconNames = themedIcon.get_names();
	let iconName = iconNames[0];

	//finally, return the icon
	return new St.Icon({
		icon_name: iconName,
		style_class: 'system-status-icon',
		y_align: Clutter.ActorAlign.CENTER
	});
}

function matchWithDesktopEntries(suspectAppName){
	let matchedEntries = Gio.DesktopAppInfo.search(suspectAppName);

	if(matchedEntries.length === 0){
		return null
	}

	return matchedEntries
}

function guessingGame(addressMatches,DBusEntryMatches){
	//Try to guess what desktop entry we should use
}

function guessByActiveApps(addressMatch,DBusEntryMatch){
	let appSystem = Shell.AppSystem.get_default();
	let runningApps = appSystem.get_running();
	let appInfos = [];

	runningApps.forEach(app => {
		let info = app.get_app_info();
		appInfos.push(info);
	});

	let addressMatch = matchWithDekstopEntries(suspectFromAddress);
	let DBusEntryMatch;

	if (suspectFromDBusEntry)
		DBusEntryMatch = matchWithDesktopEntries(suspectFromDBusEntry);

	let bestMatch;

	//if no matches, return
	if (addressMatch == null && DBusEntryMatch == null || undefined)
		return

	//let's assume DBusEntry is better (if exists)
	if (DBusEntryMatch)
		bestMatch = DBusEntryMatch[0][0];
	else
		bestMatch = addressMatch[0][0];

	//now let's try to find bestMatch in runningApps
}

