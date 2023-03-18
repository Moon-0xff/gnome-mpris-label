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
	ADDITIONAL_INFO_SUBREGEX = settings.get_string('additional-info-subregex');
	USER_REGEX_FILTER = settings.get_string('user-regex-filter');
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
	let metadata = players.selected.metadata;

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
	if (data == undefined)
		return ""

	if (data.length == 0)
		return ""

	if (data.includes("xesam:") || data.includes("mpris:"))
		return ""

	//Replaces every instance of " | "
	if(data.includes(" | "))
		data = data.replace(/ \| /g, " / ");

	data = filterAdditionalInfo(data);
	data = filterUserRegex(data);

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

function filterAdditionalInfo(datastring) {
	if(ADDITIONAL_INFO_SUBREGEX == "")
		return datastring

	let matchedSubStrings = datastring.match(new RegExp("(?:-|\\(|\\[).*(?:" + ADDITIONAL_INFO_SUBREGEX + ").*(?:$|\\)|\\])","i"));

	if (!matchedSubStrings)
		return datastring

	matchedSubStrings.forEach(match => datastring = datastring.replace(match,""));

	if (datastring.charAt(datastring.length-1) == " ")
		datastring = datastring.substring(0,datastring.length-1);

	return datastring
}

function filterUserRegex(datastring) {
	if (USER_REGEX_FILTER == "")
		return datastring

	let matches = datastring.match(new RegExp(USER_REGEX_FILTER,"i"));

	if (!matches)
		return datastring

	matches.forEach(match => datastring = datastring.replace(match,""));

	return datastring
}
