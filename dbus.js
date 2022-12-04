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

const entryInterface = `
<node>
        <interface name="org.mpris.MediaPlayer2">
                <property name="DesktopEntry" type="s" access="read"/>
        </interface>
</node>`

var getDesktopEntry = function getDesktopEntry(playerAddress){
	try {
		let entryWrapper = Gio.DBusProxy.makeProxyWrapper(entryInterface);
		let entryProxy = entryWrapper(Gio.DBus.session,playerAddress,"/org/mpris/MediaPlayer2");
		return entryProxy.DesktopEntry;
	}
	catch {
		return ""
	}
}

var getDBusList = function getDBusList(){
	let dBusProxyWrapper = Gio.DBusProxy.makeProxyWrapper(dBusInterface);
	let dBusProxy = dBusProxyWrapper(Gio.DBus.session,"org.freedesktop.DBus","/org/freedesktop/DBus");
	let dBusList = dBusProxy.ListNamesSync()[0];
	return dBusList.filter(element => element.startsWith("org.mpris.MediaPlayer2"));
}

var getPlayerStatus = function getPlayerStatus(playerAddress) {
	let statusWrapper = Gio.DBusProxy.makeProxyWrapper(mprisInterface);
	let statusProxy = statusWrapper(Gio.DBus.session,playerAddress, "/org/mpris/MediaPlayer2");
	return statusProxy.PlaybackStatus;
}

var getMetadata = function getMetadata(address){
		FIRST_FIELD = settings.get_string('first-field');
		SECOND_FIELD = settings.get_string('second-field');
		LAST_FIELD = settings.get_string('last-field');

		let metadata = "";

		let metadataWrapper = Gio.DBusProxy.makeProxyWrapper(mprisInterface);let start_time = new Date().getTime();
		let metadataProxy = metadataWrapper(Gio.DBus.session,address, "/org/mpris/MediaPlayer2");end_time = new Date().getTime(); step = end_time - start_time; log("mpris-label - metadata ("+address.substring(23)+"):"+step+"ms");
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

function parseMetadataField(data) {
	MAX_STRING_LENGTH = settings.get_int('max-string-length');
	DIVIDER_STRING = settings.get_string('divider-string');

	if (data.length == 0)
		return ""

	if (data.includes("xesam:") || data.includes("mpris:"))
		return ""
	
	//Replaces every instance of " | "
	if(data.includes(" | "))
		data = data.replace(/ \| /g, " / ");

	if(data.match(/Remaster/i))
		data = removeRemasterText(data);

	//Cut string if it's longer than MAX_STRING_LENGTH, preferably in a space
	if (data.length > MAX_STRING_LENGTH){
		data = data.substring(0, MAX_STRING_LENGTH);
		let lastIndex = data.lastIndexOf(" ");
		if(lastIndex == -1)
			lastIndex = data.length;

		data = data.substring(0, lastIndex) + "...";
	}

	data += DIVIDER_STRING;

	return data
}
