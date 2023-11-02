var buildLabel = function buildLabel(players,settings){
	const MAX_STRING_LENGTH = settings.get_int('max-string-length');
	const LABEL_FILTERED_LIST = settings.get_string('label-filtered-list');
	const DIVIDER_STRING = settings.get_string('divider-string');
	const FIRST_FIELD = settings.get_string('first-field');
	const SECOND_FIELD = settings.get_string('second-field');
	const LAST_FIELD = settings.get_string('last-field');

	let metadata = players.selected.metadata;

	if(metadata == null)
		return ""

	let fields = [FIRST_FIELD,SECOND_FIELD,LAST_FIELD]; //order is user-defined
	fields.filter(field => field != ""); //discard fields that the user defined as empty(none)

	let labelstring = "";
	fields.forEach(field => {
		let labelSettings = [LABEL_FILTERED_LIST,MAX_STRING_LENGTH,DIVIDER_STRING]
		let fieldString = players.selected.stringFromMetadata(field,metadata,labelSettings); //"extract" the string from metadata
		fieldString = parseMetadataField(fieldString,settings,labelSettings); //check, filter, customize and add divider to the extracted string
		labelstring += fieldString; //add it to the string to be displayed
	});

	labelstring = labelstring.substring(0,labelstring.length - DIVIDER_STRING.length); //remove the trailing divider

	return labelstring
}

function parseMetadataField(data,settings,[LABEL_FILTERED_LIST,MAX_STRING_LENGTH,DIVIDER_STRING]) {
	if (data == undefined || data.length == 0)
		return ""

	if (data.includes("xesam:") || data.includes("mpris:"))
		return ""

	//Replaces every instance of " | "
	if(data.includes(" | "))
		data = data.replace(/ \| /g, " / ");

	if(LABEL_FILTERED_LIST){
		const CtrlCharactersRegex = new RegExp(/[.?*+^$[\]\\(){}|-]/, 'gi');
		const sanitizedInput = LABEL_FILTERED_LIST.replace(CtrlCharactersRegex,"")

		if(sanitizedInput != LABEL_FILTERED_LIST){
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
