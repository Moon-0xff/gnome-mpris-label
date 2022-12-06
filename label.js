const ExtensionUtils = imports.misc.extensionUtils;
const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');
const CurrentExtension = ExtensionUtils.getCurrentExtension();

const {getMetadata} = CurrentExtension.imports.dbus;

let MAX_STRING_LENGTH,BUTTON_PLACEHOLDER,REMOVE_REMASTER_TEXT,
	DIVIDER_STRING,REMOVE_TEXT_WHEN_PAUSED,
	REMOVE_TEXT_PAUSED_DELAY;

function getSettings(){
	MAX_STRING_LENGTH = settings.get_int('max-string-length');
	REFRESH_RATE = settings.get_int('refresh-rate');
	BUTTON_PLACEHOLDER = settings.get_string('button-placeholder');
	REMOVE_REMASTER_TEXT = settings.get_boolean('remove-remaster-text');
	DIVIDER_STRING = settings.get_string('divider-string');
	REMOVE_TEXT_WHEN_PAUSED = settings.get_boolean('remove-text-when-paused');
	REMOVE_TEXT_PAUSED_DELAY = settings.get_int('remove-text-paused-delay');
}

function buildLabel(player,activePlayers){
	getSettings();

	if(REMOVE_TEXT_WHEN_PAUSED && player.playbackStatus != "Playing"){
		if(this.removeTextPausedIsActive(player)){
			if(activePlayers.length == 0)
				return ""
			return BUTTON_PLACEHOLDER
		}
	}

	let labelstring = getMetadata(player.address);

	labelstring =
		labelstring.substring(0,labelstring.length - DIVIDER_STRING.length);

	if(labelstring.length == 0){
		if (activePlayers.length == 0)
			return ""
		return BUTTON_PLACEHOLDER
	}
	return labelstring
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

function removeRemasterText(datastring) {
	if(!REMOVE_REMASTER_TEXT)
		return datastring

	let matchedSubString = datastring.match(/\((.*?)\)/gi); //matches text between parentheses

	if (!matchedSubString)
		matchedSubString = datastring.match(/-(.*?)$/gi); //matches text between a hyphen(-) and the end of the string

	if (!matchedSubString)
		return datastring //returns <datastring> unaltered if both matches were not successful

	if(!matchedSubString[0].match(/Remaster/i))
		return datastring //returns <datastring> unaltered if our match doesn't contain 'remaster'

	datastring = datastring.replace(matchedSubString[0],"");

	if (datastring.charAt(datastring.length-1) == " ")
		datastring = datastring.substring(0,datastring.length-1);

	return datastring
}

