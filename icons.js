const {Clutter,Gio,GLib,GObject,Shell,St} = imports.gi;

var getIcon = function getIcon(playerAddress){
	let icon = new St.Icon({
		style_class: 'system-status-icon',
		fallback_icon_name: 'audio-volume-high',
		style: "padding-left: 0px;padding-right: 0px;"
	});

	if(playerAddress == null | undefined)
		return icon

	let addressWithoutMPRIS = playerAddress.substring(23);
	let addressSuspectName = getSuspectAppName(addressWithoutMPRIS);

	log("mpris-label: " + "addressSuspectName=(" + addressSuspectName + ")");

	let suspectMatch = searchInDesktopEntries(addressSuspectName);

	if(suspectMatch == null)
		suspectMatch = searchInDesktopEntries(dBusEntrySuspectName);

	if(suspectMatch == null)
		return icon

	let entry = Gio.DesktopAppInfo.new(suspectMatch);
	let gioIcon = entry.get_icon();
	icon.set_gicon(gioIcon);
	return icon
}

function getSuspectAppName(initialString){
	if (!initialString)
		return null

	if (!initialString.includes("."))
		return initialString

	let elements = initialString.split(".");
	let filteredElements = [];

	elements.forEach(element => {
		if(!element.match(/desktop|Client|device|org|com|net|instance.*/gi))
			filteredElements.push(element);
	});

	log("mpris-label: " + "initialString=(" + initialString +
		") elements=(" + elements + ") filteredElements=(" + filteredElements + ")");

	if (filteredElements.length == 1)
		return filteredElements[0]

	if (filteredElements.length > 2 && elements.length > 2) 
		return filteredElements.at(-1) //assume first elements are unrecognized domain names

	if (filteredElements.length > 0)
		return filteredElements.join(".");

	return initialString
}

function searchInDesktopEntries(suspectAppName){
	if(suspectAppName == null || undefined || "")
		return null

	let matchedEntries = Gio.DesktopAppInfo.search(suspectAppName);

	if(!matchedEntries.length === 0)
		return matchedEntries[0][0]

	if (suspectAppName == "chromium") //retry with the name google-chrome if as both browsers identify as chromium
		matchedEntries = Gio.DesktopAppInfo.search("google-chrome")
	
	if(matchedEntries.length === 0)
		return null

	return matchedEntries[0][0];
}
