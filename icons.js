const {Clutter,Gio,GLib,GObject,Shell,St} = imports.gi;
const Panel = imports.ui.panel;
const ExtensionUtils = imports.misc.extensionUtils;
const CurrentExtension = ExtensionUtils.getCurrentExtension();

const {getDesktopEntry} = CurrentExtension.imports.dbus;

var fallbackIcon = new St.Icon({
	style_class: 'system-status-icon',
	icon_name: 'audio-volume-high',
	style: "padding-left: 0px;padding-right: 0px;"
});

var getIcon = function getIcon(playerAddress){
	if(playerAddress == null | undefined)
		return fallbackIcon

	// Try to get the desktop entry string from DBus
	let playerDesktopEntry = getDesktopEntry(playerAddress);

	// Get desktop entries that match DBus first "element" after org.mpris.MediaPlayer2.Player
	let addressWithoutMPRIS =
		playerAddress.substring(23);

	let firstDot = addressWithoutMPRIS.indexOf(".");

	let suspectAppName = addressWithoutMPRIS;
	if (firstDot > 0)
		suspectAppName = addressWithoutMPRIS.substring(0,firstDot)

	let DBusAddressMatches = matchWithDesktopEntries(suspectAppName);

	let bestMatch = DBusAddressMatches;//default
	// Get desktop entries that match the one provided by DBus (if avaliable)
	if (playerDesktopEntry){
		let DBusDesktopEntryMatches = matchWithDesktopEntries(playerDesktopEntry);
		// Guess the best match
		let bestMatch = compareMatches(DBusAddressMatches,DBusDesktopEntryMatches);
	}

	// If there's no best match, return fallbackIcon
	if (bestMatch == null)
		return fallbackIcon

	// Get the icon name of the best match
	let bestMatchEntry = Gio.DesktopAppInfo.new(bestMatch);
	let themedIcon = bestMatchEntry.get_icon();
	let iconNames = themedIcon.get_names();
	let iconName = iconNames[0];

	// Finally, return the icon
	return new St.Icon({
		icon_name: iconName,
		style_class: 'system-status-icon',
		y_align: Clutter.ActorAlign.CENTER,
		style: "padding-left: 0px;padding-right: 0px;"
	});
}

function compareMatches(DBusAddressMatches,DBusDesktopEntryMatches){
	// If no matches, return null
	if ( DBusAddressMatches == null && DBusDesktopEntryMatches == null )
		return null;

	// If only one guess returned matches, assign the fist element as bestMatch
	else if ( (DBusAddressMatches || DBusDesktopEntryMatches) != null ){
		if (DBusAddressMatches != null){
			bestMatch = DBusAddressMatches;
		}
		else if (DBusDesktopEntryMatches != null){
			bestMatch = DBusDesktopEntryMatches;
		}
	}
	// If both returned matches, compare them
	else if ( (DBusAddressMatches != null) && (DBusDesktopEntryMatches != null || undefined) ){
		//how?
		bestMatch = DBusDesktopEntryMatches;
	}

	return bestMatch
}

function matchWithDesktopEntries(suspectAppName){
	let matchedEntries = Gio.DesktopAppInfo.search(suspectAppName);

	if(!matchedEntries.length === 0)
		return matchedEntries[0][0]

	if (suspectAppName == "chromium") //retry with the name google-chrome if as both browsers identify as chromium
		matchedEntries = Gio.DesktopAppInfo.search("google-chrome")
	
	if(matchedEntries.length === 0)
		return null

	return matchedEntries[0][0];
}
