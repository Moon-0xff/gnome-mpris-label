const {Gio,Gtk} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Config = imports.misc.config;

let position = 0;

function init(){}

function buildPrefsWidget(){
	const [major] = Config.PACKAGE_VERSION.split('.');
	const shellVersion = Number.parseInt(major);

	let prefsWidget = new Gtk.Notebook({visible: true});
	let settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');
	let panelPage = buildGrid(shellVersion,settings);
	let labelPage = buildGrid(shellVersion,settings);

//panel page:
	addSpinButton(panelPage,'left-padding','Left padding:',0,500);
	addSpinButton(panelPage,'right-padding','Right padding:',0,500);
	addSpinButton(panelPage,'extension-index','Extension index:',0,20);
	let extensionPlaceComboBox = addStringComboBox(panelPage,'extension-place','Extension place:',{'left':'left','center':'center','right':'right'});
	addSpinButton(panelPage,'reposition-delay','Panel reposition at startup (delay in seconds):',0,300);
	addSwitch(panelPage,'reposition-on-button-press','Update panel position on every button press:');

	let resetButton = new Gtk.Button({
		label: 'Reset settings',
		visible: true
	});
	panelPage.attach(resetButton,0,position,1,1);

	resetButton.connect('clicked',() => {
		settings.reset('left-padding');
		settings.reset('right-padding');
		settings.reset('extension-index');
		settings.reset('extension-place');
		settings.reset('reposition-delay');
		settings.reset('reposition-on-button-press');
		extensionPlaceComboBox.set_active_id(settings.get_string('extension-place'));
	});

//label page:
	position = 0; //this line this line seems to be unnecessary

	addSpinButton(labelPage,'max-string-length','Max string length (each field):',1,150);
	addSpinButton(labelPage,'refresh-rate','Refresh rate:',30,3000);
	addEntry(labelPage,'button-placeholder','Button placeholder (can be left empty):');
	addSwitch(labelPage,'remove-remaster-text','Remove remaster text:');
	addEntry(labelPage,'divider-string','Divider string (you can use spaces):');

	//visible fields is a bit more complex
	addLabel(labelPage,'Visible fields and order:');

	let visibleFieldsBox = new Gtk.Box({
		spacing: 12,
		visible: true
	});

	let fieldOptions = {'artist':'xesam:artist','album':'xesam:album','title':'xesam:title'};

	let firstFieldComboBox = buildStringComboBox(settings,'first-field',fieldOptions);

	fieldOptions['none'] = '';

	let secondFieldComboBox = buildStringComboBox(settings,'second-field',fieldOptions);
	let lastFieldComboBox = buildStringComboBox(settings,'last-field',fieldOptions);

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
	labelPage.attach(visibleFieldsBox,1,position,1,1);
	position++;

	addSwitch(labelPage,'remove-text-when-paused','Hide when paused:');
	addSpinButton(labelPage,'remove-text-paused-delay','Hide when paused delay (seconds):',0,10800);
	addSwitch(labelPage,'auto-switch-to-most-recent','Switch to the most recent source automatically:');
	let showIconComboBox = addStringComboBox(labelPage,'show-icon','Show source icon:',{'off':'','left':'left','right':'right'});

	resetButton = new Gtk.Button({
		label: 'Reset settings',
		visible: true
	});
	labelPage.attach(resetButton,0,position,1,1);

	resetButton.connect('clicked',() => {
		settings.reset('max-string-length');
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
		firstFieldComboBox.set_active_id(settings.get_string('first-field'));
		secondFieldComboBox.set_active_id(settings.get_string('second-field'));
		lastFieldComboBox.set_active_id(settings.get_string('last-field'));
		showIconComboBox.set_active_id(settings.get_string('show-icon'));
	});

	prefsWidget.append_page(panelPage, new Gtk.Label({ label: "Panel", halign: Gtk.Align.START, visible: true }));
	prefsWidget.append_page(labelPage, new Gtk.Label({ label: "Label", halign: Gtk.Align.START, visible: true }));
	return prefsWidget
}

function addSpinButton(widget,setting,labelstring,lower,upper){
	addLabel(widget,labelstring);
	let thisSpinButton = new Gtk.SpinButton({
		adjustment: new Gtk.Adjustment({
			lower: lower,
			upper: upper,
			step_increment: 1
		}),
		visible: true
	});
	widget.attach(thisSpinButton,1,position,1,1);
	widget._settings.bind(setting,thisSpinButton,'value',Gio.SettingsBindFlags.DEFAULT);
	position++;
}

function addStringComboBox(widget,setting,labelstring,options){
	addLabel(widget,labelstring);
	thisComboBox = buildStringComboBox(widget._settings,setting,options);
	widget.attach(thisComboBox,1,position,1,1);
	position++;

	return thisComboBox //necessary to reset position when the reset button is clicked
}

function addSwitch(widget,setting,labelstring){
	addLabel(widget,labelstring);
	let thisSwitch = new Gtk.Switch({
		valign: Gtk.Align.END,
		halign: Gtk.Align.END,
		visible: true
	});
	widget.attach(thisSwitch,1,position,1,1);
	widget._settings.bind(setting,thisSwitch,'active',Gio.SettingsBindFlags.DEFAULT);
	position++;
}

function addEntry(widget,setting,labelstring){
	addLabel(widget,labelstring);
	let thisEntry = new Gtk.Entry({
		visible: true
	});
	widget.attach(thisEntry,1,position,1,1);
	widget._settings.bind(setting,thisEntry,'text',Gio.SettingsBindFlags.DEFAULT);
	position++;
}

function addLabel(widget,labelstring){
	let thisLabel = new Gtk.Label({
		label: labelstring,
		halign: Gtk.Align.START,
		visible: true
	});
	widget.attach(thisLabel,0,position,1,1);
}

function buildStringComboBox(settings,setting,options){
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

function buildGrid(shellVersion,settings){
	if(shellVersion < 40){
		widget = new Gtk.Grid({
			margin: 18,
			column_spacing: 12,
			row_spacing: 12,
			visible: true,
			column_homogeneous: true
		});
	}
	else {
		widget = new Gtk.Grid({
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
	widget._settings = settings;
	return widget
}
