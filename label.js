const ExtensionUtils = imports.misc.extensionUtils;
const CurrentExtension = ExtensionUtils.getCurrentExtension();

let MAX_STRING_LENGTH,BUTTON_PLACEHOLDER,LABEL_FILTERED_LIST,
	DIVIDER_STRING,REMOVE_TEXT_WHEN_PAUSED,
	REMOVE_TEXT_PAUSED_DELAY,FIRST_FIELD,SECOND_FIELD,LAST_FIELD
	MAX_STRING_LENGTH,DIVIDER_STRING;

function getSettings(){
	const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');
	MAX_STRING_LENGTH = settings.get_int('max-string-length');
	REFRESH_RATE = settings.get_int('refresh-rate');
	BUTTON_PLACEHOLDER = settings.get_string('button-placeholder');
	LABEL_FILTERED_LIST = settings.get_string('label-filtered-list');
	DIVIDER_STRING = settings.get_string('divider-string');
	REMOVE_TEXT_WHEN_PAUSED = settings.get_boolean('remove-text-when-paused');
	REMOVE_TEXT_PAUSED_DELAY = settings.get_int('remove-text-paused-delay');
	FIRST_FIELD = settings.get_string('first-field');
	SECOND_FIELD = settings.get_string('second-field');
	LAST_FIELD = settings.get_string('last-field');
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

	let metadata = players.selected.metadata;

	if(metadata == null)
		return placeholder

	let fields = [FIRST_FIELD,SECOND_FIELD,LAST_FIELD]; //order is user-defined
	fields.filter(field => field != ""); //discard fields that the user defined as empty(none)

	let labelstring = "";
	fields.forEach(field => {
		let fieldString = stringFromMetadata(field,metadata); //"extract" the string from metadata
		fieldString = parseMetadataField(fieldString); //check, filter, customize and add divider to the extracted string
		labelstring += fieldString; //add it to the string to be displayed
	});

	labelstring = labelstring.substring(0,labelstring.length - DIVIDER_STRING.length); //remove the trailing divider

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

function stringFromMetadata(field,metadata) {
	// metadata is a javascript object
	// each "field" correspond to a string-keyed property on metadata
	// each property contains a GLib.Variant object
	if (Object.keys(metadata).includes(field)){
		let variant = metadata[field];

		if(variant.get_type().is_array())
			return variant.get_strv()[0]
		else
			return variant.get_string()[0]
	}
	return ""
}

function parseMetadataField(data) {
	if (data == undefined || data.length == 0)
		return ""

	if (data.includes("xesam:") || data.includes("mpris:"))
		return ""

	//Replaces every instance of " | "
	if(data.includes(" | "))
		data = data.replace(/ \| /g, " / ");

	if(LABEL_FILTERED_LIST){
		const GraphCharactersRegex = new RegExp('[!"\\$%&\'\\(\\)\\*\\+-\\.\\/:;<=>\\?@\\[\\\\\\]\\^_`{\\|}~]','gi');
		const sanitizedInput = LABEL_FILTERED_LIST.replace(GraphCharactersRegex,"")

		if(sanitizedInput != LABEL_FILTERED_LIST){
			const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');
			settings.set_string('label-filtered-list',sanitizedInput);
		}

		const filterRegex = new RegExp("(?:-|\\(|\\[).*(?:" + sanitizedInput.replace(",","|") + ").*(?:$|\\)|\\])","gi");

		data = data.replace(filterRegex,"");
	}

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
