const ExtensionUtils = imports.misc.extensionUtils;
const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');
const CurrentExtension = ExtensionUtils.getCurrentExtension();

let MAX_STRING_LENGTH,BUTTON_PLACEHOLDER,REMOVE_REMASTER_TEXT,
	DIVIDER_STRING,REMOVE_TEXT_WHEN_PAUSED,
	REMOVE_TEXT_PAUSED_DELAY,FIRST_FIELD,SECOND_FIELD,LAST_FIELD
	MAX_STRING_LENGTH,DIVIDER_STRING;

function getSettings(){
	MAX_STRING_LENGTH = settings.get_int('max-string-length');
	REFRESH_RATE = settings.get_int('refresh-rate');
	BUTTON_PLACEHOLDER = settings.get_string('button-placeholder');
	REMOVE_REMASTER_TEXT = settings.get_boolean('remove-remaster-text');
	DIVIDER_STRING = settings.get_string('divider-string');
	REMOVE_TEXT_WHEN_PAUSED = settings.get_boolean('remove-text-when-paused');
	REMOVE_TEXT_PAUSED_DELAY = settings.get_int('remove-text-paused-delay');
	FIRST_FIELD = settings.get_string('first-field');
	SECOND_FIELD = settings.get_string('second-field');
	LAST_FIELD = settings.get_string('last-field');
	MAX_STRING_LENGTH = settings.get_int('max-string-length');
	DIVIDER_STRING = settings.get_string('divider-string');
}

var buildLabel = function buildLabel(player,activePlayers){
	getSettings();

	let labelstring = getLabelString(player.getMetadata());

	if(REMOVE_TEXT_WHEN_PAUSED && player.playbackStatus != "Playing"){
		labelstring = removeTextWhenPaused(labelstring,player);
	}

	if(labelstring.length == 0){
		if (activePlayers.length == 0)
			return ""
		return BUTTON_PLACEHOLDER
	}
	return labelstring
}

function removeTextWhenPaused(labelstring,player){
	return ""
}

function getLabelString(metadata){
	let labelstring = "";
	let fields = [FIRST_FIELD,SECOND_FIELD,LAST_FIELD];

	fields.forEach(field => {
		try {
			labelstring = labelstring + parseMetadataField(metadata[field].get_string()[0]);
		}

		catch {
			labelstring = labelstring + parseMetadataField(metadata[field].get_strv()[0]);
		}
	});
	return labelstring
}

function parseMetadataField(data) {
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

