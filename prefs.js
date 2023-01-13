const {Gio,Gtk} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Config = imports.misc.config;

let prefsWidget;
let settings;
let position = 0;

function init(){}

function buildPrefsWidget(){
	const [major] = Config.PACKAGE_VERSION.split('.');
	const shellVersion = Number.parseInt(major);

	settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');

	if(shellVersion < 40){
		prefsWidget = new Gtk.Grid({
			margin: 18,
			column_spacing: 12,
			row_spacing: 12,
			visible: true,
			column_homogeneous: true
		});
	}
	else {
		prefsWidget = new Gtk.Grid({
			margin_top: 10,
			margin_bottom: 10,
			margin_start: 10,
			margin_end: 10,
			column_spacing: 12,
			row_spacing: 12,
			visible: true,
			column_homogeneous: true
		});
	}

	addSpinButton('left-padding','Left padding:',0,500);
	addSpinButton('right-padding','Right padding:',0,500);
	addSpinButton('max-string-length','Max string length (each field):',1,150);
	addSpinButton('extension-index','Extension index:',0,20);
	let extensionPlaceComboBox = addStringComboBox('extension-place','Extension place:',{'left':'left','center':'center','right':'right'});
	addSpinButton('refresh-rate','Refresh rate:',30,3000);
	addEntry('button-placeholder','Button placeholder (can be left empty):');
	addSwitch('remove-remaster-text','Remove remaster text:');
	addEntry('divider-string','Divider string (you can use spaces):');

	//visible fields is a bit more complex
	addLabel('Visible fields and order:');

	let visibleFieldsBox = new Gtk.Box({
		spacing: 12,
		visible: true
	});

	let fieldOptions = {'artist':'xesam:artist','album':'xesam:album','title':'xesam:title'};

	let firstFieldComboBox = buildStringComboBox('first-field',fieldOptions);

	fieldOptions['none'] = '';

	let secondFieldComboBox = buildStringComboBox('second-field',fieldOptions);
	let lastFieldComboBox = buildStringComboBox('last-field',fieldOptions);

	if(shellVersion < 40){
		visibleFieldsBox.pack_start(firstFieldComboBox,true,true,0);
		visibleFieldsBox.pack_start(secondFieldComboBox,true,true,0);
		visibleFieldsBox.pack_start(lastFieldComboBox,true,true,0);
	}
	else {
		visibleFieldsBox.append(firstFieldComboBox,true,true,0);
		visibleFieldsBox.append(secondFieldComboBox,true,true,0);
		visibleFieldsBox.append(lastFieldComboBox,true,true,0);
	}
	prefsWidget.attach(visibleFieldsBox,1,position,1,1);
	position++;

	addSwitch('remove-text-when-paused','Hide when paused:');
	addSpinButton('remove-text-paused-delay','Hide when paused delay (seconds):',0,10800);
	addSwitch('auto-switch-to-most-recent','Switch to the most recent source automatically:');
	let showIconComboBox = addStringComboBox('show-icon','Show source icon:',{'off':'','left':'left','right':'right'});

	let resetButton = new Gtk.Button({
		label: 'Reset settings',
		visible: true
	});
	prefsWidget.attach(resetButton,0,position,1,1);

	resetButton.connect('clicked',() => {
		settings.reset('left-padding');
		settings.reset('right-padding');
		settings.reset('max-string-length');
		settings.reset('extension-index');
		settings.reset('extension-place');
		settings.reset('refresh-rate');
		settings.reset('button-placeholder');
		settings.reset('remove-remaster-text');
		settings.reset('divider-string');
		settings.reset('first-field');
		settings.reset('second-field');
		settings.reset('last-field');
		settings.reset('remove-text-when-paused');
		settings.reset('remove-text-paused-delay');
		settings.reset('auto-switch-to-most-recent');
		settings.reset('show-icon');
		extensionPlaceComboBox.set_active_id(settings.get_string('extension-place'));
		firstFieldComboBox.set_active_id(settings.get_string('first-field'));
		secondFieldComboBox.set_active_id(settings.get_string('second-field'));
		lastFieldComboBox.set_active_id(settings.get_string('last-field'));
		showIconComboBox.set_active_id(settings.get_string('show-icon'));
	});

	return prefsWidget
}

function addSpinButton(setting,labelstring,lower,upper){
	addLabel(labelstring);
	let thisSpinButton = new Gtk.SpinButton({
		adjustment: new Gtk.Adjustment({
			lower: lower,
			upper: upper,
			step_increment: 1
		}),
		visible: true
	});
	prefsWidget.attach(thisSpinButton,1,position,1,1);
	settings.bind(setting,thisSpinButton,'value',Gio.SettingsBindFlags.DEFAULT);
	position++;
}

function addStringComboBox(setting,labelstring,options){
	addLabel(labelstring);
	thisComboBox = buildStringComboBox(setting,options);
	prefsWidget.attach(thisComboBox,1,position,1,1);
	position++;

	return thisComboBox //necessary to reset position when the reset button is clicked
}

function addSwitch(setting,labelstring){
	addLabel(labelstring);
	let thisSwitch = new Gtk.Switch({
		valign: Gtk.Align.END,
		halign: Gtk.Align.END,
		visible: true
	});
	prefsWidget.attach(thisSwitch,1,position,1,1);
	settings.bind(setting,thisSwitch,'active',Gio.SettingsBindFlags.DEFAULT);
	position++;
}

function addEntry(setting,labelstring){
	addLabel(labelstring);
	let thisEntry = new Gtk.Entry({
		visible: true
	});
	prefsWidget.attach(thisEntry,1,position,1,1);
	settings.bind(setting,thisEntry,'text',Gio.SettingsBindFlags.DEFAULT);
	position++;
}

function addLabel(labelstring){
	let thisLabel = new Gtk.Label({
		label: labelstring,
		halign: Gtk.Align.START,
		visible: true
	});
	prefsWidget.attach(thisLabel,0,position,1,1);
}

function buildStringComboBox(setting,options){
	let thisComboBox = new Gtk.ComboBoxText({
		halign: Gtk.Align.END,
		visible: true
	});
	for (let option in options){
		thisComboBox.append(options[option],option);
	}
	thisComboBox.set_active_id(settings.get_string(setting));
	thisComboBox.connect('changed', () => {
		settings.set_string(setting,thisComboBox.get_active_id());
	});

	return thisComboBox
}
