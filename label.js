const ExtensionUtils = imports.misc.extensionUtils;
const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');
const CurrentExtension = ExtensionUtils.getCurrentExtension();

const {getMetadata} = CurrentExtension.imports.dbus;

let MAX_STRING_LENGTH,BUTTON_PLACEHOLDER,REMOVE_REMASTER_TEXT,
	DIVIDER_STRING,FIRST_FIELD,SECOND_FIELD,LAST_FIELD,
	REMOVE_TEXT_WHEN_PAUSED,REMOVE_TEXT_PAUSED_DELAY;

let removeTextPausedDelayStamp = null;
let removeTextPlayerTimestamp = 0;

function getSettings(){
	MAX_STRING_LENGTH = settings.get_int('max-string-length');
	REFRESH_RATE = settings.get_int('refresh-rate');
	BUTTON_PLACEHOLDER = settings.get_string('button-placeholder');
	REMOVE_REMASTER_TEXT = settings.get_boolean('remove-remaster-text');
	DIVIDER_STRING = settings.get_string('divider-string');
	FIRST_FIELD = settings.get_string('first-field');
	SECOND_FIELD = settings.get_string('second-field');
	LAST_FIELD = settings.get_string('last-field');
	REMOVE_TEXT_WHEN_PAUSED = settings.get_boolean('remove-text-when-paused');
	REMOVE_TEXT_PAUSED_DELAY = settings.get_int('remove-text-paused-delay');
}

var buildLabel = function buildLabel(player,activePlayers){
	getSettings();

	if(REMOVE_TEXT_WHEN_PAUSED && player.playbackStatus != "Playing"){
		if(removeTextPausedIsActive(player)){
			if(activePlayers.length == 0)
				return ""
			return BUTTON_PLACEHOLDER
		}
	}

	let labelstring =
		getMetadata(player.address,FIRST_FIELD)+
		getMetadata(player.address,SECOND_FIELD)+
		getMetadata(player.address,LAST_FIELD);

	labelstring =
		labelstring.substring(0,labelstring.length - DIVIDER_STRING.length);

	if(labelstring.length == 0){
		if (activePlayers.length == 0)
			return ""
		return BUTTON_PLACEHOLDER
	}
	return labelstring
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

function removeTextPausedIsActive(player){
	if (REMOVE_TEXT_PAUSED_DELAY <= 0){
		return true
	}

	if (player.statusTimestamp != removeTextPlayerTimestamp && removeTextPausedDelayStamp == null){
		removeTextPausedDelayStamp = new Date().getTime() / 1000;
		return false
	}

	let timeNow = new Date().getTime() / 1000;
	if(removeTextPausedDelayStamp + REMOVE_TEXT_PAUSED_DELAY <= timeNow){
		removeTextPausedDelayStamp = null;
		removeTextPlayerTimestamp = player.statusTimestamp;
		return true
	}
	return false
}

