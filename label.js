const ExtensionUtils = imports.misc.extensionUtils;
const CurrentExtension = ExtensionUtils.getCurrentExtension();

let MAX_STRING_LENGTH,BUTTON_PLACEHOLDER,REMOVE_REMASTER_TEXT,
	DIVIDER_STRING,REMOVE_TEXT_WHEN_PAUSED,
	REMOVE_TEXT_PAUSED_DELAY, LABEL_FORMAT

function getSettings(){
	const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');
	MAX_STRING_LENGTH = settings.get_int('max-string-length');
	REFRESH_RATE = settings.get_int('refresh-rate');
	BUTTON_PLACEHOLDER = settings.get_string('button-placeholder');
	REMOVE_REMASTER_TEXT = settings.get_boolean('remove-remaster-text');
	REMOVE_TEXT_WHEN_PAUSED = settings.get_boolean('remove-text-when-paused');
	REMOVE_TEXT_PAUSED_DELAY = settings.get_int('remove-text-paused-delay');
	LABEL_FORMAT = settings.get_string("label-format");
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

	const substitutions = new Map();
	substitutions.set("ARTIST", parseMetadataField(stringFromMetadata("xesam:artist",metadata)));
	substitutions.set("ALBUM", parseMetadataField(stringFromMetadata("xesam:album",metadata)));
	substitutions.set("TITLE", parseMetadataField(stringFromMetadata("xesam:title",metadata)));
	substitutions.set("IDENTITY", players.selected.identity);
	substitutions.set("STATUS", players.selected.playbackStatus);

	let labelString = LABEL_FORMAT;

	substitutions.forEach( (value,key) => labelString = labelString.replaceAll(`%${key}%`,value));

	// FORMAT: {{string}}{{replacement vales}}
	// Regex allows for escape characters: \{ and \}
	const setRegex = /(\{\{.{1,}?\}\}){2}/g
	
	// Find sets in string
	const sets = labelString.match(setRegex)
	if(sets)
		sets.forEach((substring)=>{
			// Keep original for later, and split the set
			const original = substring
			substring = substring.slice(2).slice(0,-2).split("}}{{")
			
			// Find the substitution keys, and replace them in the string
			let substitutionKeys = substring[1].split(/\|/g)
			for(let i = 0; i < substitutionKeys.length; i++){
				const substitution = substitutions.get(substitutionKeys[i])
				if(substitution && substitution.length > 0){
					substring[0] = substring[0].replace('VALUE',substitution)
					break;
				// Special case, empty string if no value is found
				} else if (substitutionKeys[i]=='EMPTY'){
					substring[0] = ''
					break;
				}
			}
			labelString = labelString.replace(original, substring[0])
		})

	if (labelString.length === 0)
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

