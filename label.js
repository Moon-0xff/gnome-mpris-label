const ExtensionUtils = imports.misc.extensionUtils;
const CurrentExtension = ExtensionUtils.getCurrentExtension();

let MAX_STRING_LENGTH,BUTTON_PLACEHOLDER,REMOVE_REMASTER_TEXT,
	DIVIDER_STRING,REMOVE_TEXT_WHEN_PAUSED,
	REMOVE_TEXT_PAUSED_DELAY,FIRST_FIELD,SECOND_FIELD,LAST_FIELD
	MAX_STRING_LENGTH,DIVIDER_STRING;

function getSettings(){
	const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');
	MAX_STRING_LENGTH = settings.get_int('max-string-length');
	REFRESH_RATE = settings.get_int('refresh-rate');
	BUTTON_PLACEHOLDER = settings.get_string('button-placeholder');
	DIVIDER_STRING = settings.get_string('divider-string');
	REMOVE_TEXT_WHEN_PAUSED = settings.get_boolean('remove-text-when-paused');
	REMOVE_TEXT_PAUSED_DELAY = settings.get_int('remove-text-paused-delay');
	FIRST_FIELD = settings.get_string('first-field');
	SECOND_FIELD = settings.get_string('second-field');
	LAST_FIELD = settings.get_string('last-field');
	MAX_STRING_LENGTH = settings.get_int('max-string-length');
	DIVIDER_STRING = settings.get_string('divider-string');
	LABEL_FILTERED_LIST = settings.get_string('label-filtered-list');
}

var buildLabel = function buildLabel(players){
	getSettings();

	// the placeholder string is a hint for the user to switch players
	// it should appear if labelstring is empty and there's another player playing
	// avoid returning empty strings directly, use "placeholder" instead
	let placeholder = "";
	if (players.activePlayers.length > 0 && players.selected.playbackStatus != "Playing")
		placeholder = BUTTON_PLACEHOLDER;

	if(REMOVE_TEXT_WHEN_PAUSED){
		if(removeTextWhenPaused(players.selected))
			return placeholder
	}

	// metadata is a javascript object
	// "fields" are enumerable string-keyed properties
	// each "field" is a GLib.Variant object
	let metadata = players.selected.getMetadata();

	if(metadata == null)
		return placeholder

	let labelstring = "";
	let variant;
	let fields = [FIRST_FIELD,SECOND_FIELD,LAST_FIELD];
	fields.filter(field => field != "");

	fields.forEach(field => {
		if (Object.keys(metadata).includes(field)){
			variant = metadata[field];

			if(variant.get_type().is_array())
				labelstring = labelstring + parseMetadataField(variant.get_strv()[0]);
			else
				labelstring = labelstring + parseMetadataField(variant.get_string()[0]);
		}
	});

	labelstring = labelstring.substring(0,labelstring.length - DIVIDER_STRING.length);

	if(labelstring.length === 0)
		return placeholder

	return labelstring
}

function removeTextWhenPaused(player){
	if (player.playbackStatus == "Playing")
		return false

	if ( (player.statusTimestamp / 1000) + REMOVE_TEXT_PAUSED_DELAY <= new Date().getTime() / 1000){
		return true
	}
}

function parseMetadataField(data) {
	if (data.length == 0)
		return ""

	if (data.includes("xesam:") || data.includes("mpris:"))
		return ""

	//Replaces every instance of " | "
	if(data.includes(" | "))
		data = data.replace(/ \| /g, " / ");

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
	if(LABEL_FILTERED_LIST == "")
		return datastring

	let matchedSubString = datastring.match(/\((.*?)\)/gi); //matches text between parentheses

	if (!matchedSubString)
		matchedSubString = datastring.match(/-(.*?)$/gi); //matches text between a hyphen(-) and the end of the string

	if (!matchedSubString)
		return datastring //returns <datastring> unaltered if both matches were not successful

	const filterlist = LABEL_FILTERED_LIST.toLowerCase().split(',');

	filterlist.forEach(filter => { //go through each filter to look for a match
		if(matchedSubString[0].toLowerCase().match(filter)){
			datastring = datastring.replace(matchedSubString[0],"");
		}
	});

	if (datastring.charAt(datastring.length-1) == " ")
		datastring = datastring.substring(0,datastring.length-1);

	return datastring
}

