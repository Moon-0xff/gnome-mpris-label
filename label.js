const ExtensionUtils = imports.misc.extensionUtils;
const CurrentExtension = ExtensionUtils.getCurrentExtension();

let MAX_STRING_LENGTH,BUTTON_PLACEHOLDER,REMOVE_REMASTER_TEXT,
	DIVIDER_STRING,REMOVE_TEXT_WHEN_PAUSED,
	REMOVE_TEXT_PAUSED_DELAY, FORMAT
	MAX_STRING_LENGTH;

function getSettings(){
	const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');
	MAX_STRING_LENGTH = settings.get_int('max-string-length');
	REFRESH_RATE = settings.get_int('refresh-rate');
	BUTTON_PLACEHOLDER = settings.get_string('button-placeholder');
	REMOVE_REMASTER_TEXT = settings.get_boolean('remove-remaster-text');
	REMOVE_TEXT_WHEN_PAUSED = settings.get_boolean('remove-text-when-paused');
	REMOVE_TEXT_PAUSED_DELAY = settings.get_int('remove-text-paused-delay');
	FORMAT = settings.get_string("format");
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


	const substitutions = [ 	// [value to replace, value in metadata]
        ["artist", "xesam:artist"],
        ["album", "xesam:album"],
        ["title", "xesam:title"],
    ];

	let labelString = FORMAT;
	let hasSubstitutions = false; // if no substitutions, render placeholder
	let hasEmptySubstitutions = true; // if all substitutions are empty, render placeholder

	substitutions.forEach((value) => {
		let fieldString = stringFromMetadata(value[1], metadata); //"extract" the string from metadata
		fieldString = parseMetadataField(fieldString);

		const regex = new RegExp(`%${value[0].toUpperCase()}%`, "g"); //generate regex for value

		// test if there any substitutions
		if(regex.test(labelString)){
			// if there are replace them
			labelString = labelString.replace(regex, fieldString)
			hasSubstitutions = true
			if(fieldString.length != 0) hasEmptySubstitutions = false
		}
	});

	if(!hasSubstitutions || hasEmptySubstitutions)
		return placeholder

	return labelString
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

	if(REMOVE_REMASTER_TEXT)
		data = data.replace(/(?:-|\(|\]).*(?:remaster).*(?:$|\)|\])/i,"");

	//Cut string if it's longer than MAX_STRING_LENGTH, preferably in a space
	if (data.length > MAX_STRING_LENGTH){
		data = data.substring(0, MAX_STRING_LENGTH);
		let lastIndex = data.lastIndexOf(" ");
		if(lastIndex == -1)
			lastIndex = data.length;

		data = data.substring(0, lastIndex) + "...";
	}

	return data
}

