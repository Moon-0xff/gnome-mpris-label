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
	let filtersPage = buildGrid(shellVersion,settings);

	if(shellVersion >= 40){ //workaround taken directly from gjs.guide
		prefsWidget.connect('realize', () => {
		    let window = prefsWidget.get_root();
		    window.default_width = 600;
		    window.default_height = 700;
		});
	}

//panel page:
	addSubcategoryLabel(panelPage,'Position');
	addSpinButton(panelPage,'left-padding','Left padding:',0,500,"Set spacing to the left of the widget");
	addSpinButton(panelPage,'right-padding','Right padding:',0,500,"Set spacing to the right of the widget");
	let extensionPlaceComboBox = addStringComboBox(panelPage,'extension-place','Extension place:',{'left':'left','center':'center','right':'right'},"Define if the widget should be located in the Left, Center or right of the panel");
	addSpinButton(panelPage,'extension-index','Extension index:',0,20,"Set widget location within with respect to other adjacent widgets");

	addSubcategoryLabel(panelPage,'Wrong index at loadup mitigations');
	addSpinButton(panelPage,'reposition-delay','Panel reposition at startup (delay in seconds):',0,300,undefined);
	addSwitch(panelPage,'reposition-on-button-press','Update panel position on every button press:',undefined);

	addButton(panelPage,'Reset panel settings', () => {
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

	addSubcategoryLabel(labelPage,'Behaviour');
	addSwitch(labelPage,'auto-switch-to-most-recent','Switch to the most recent source automatically:',undefined);
	addSwitch(labelPage,'remove-remaster-text','Remove remaster text:',undefined);
	addSwitch(labelPage,'remove-text-when-paused','Hide when paused:',undefined);
	addSpinButton(labelPage,'remove-text-paused-delay','Hide when paused delay (seconds):',0,10800,undefined);
	addSpinButton(labelPage,'refresh-rate','Refresh rate (milliseconds):',30,3000,undefined);

	addSubcategoryLabel(labelPage,'Appearance');
	addSpinButton(labelPage,'max-string-length','Max string length (each field):',1,150,undefined);
	addEntry(labelPage,'button-placeholder','Button placeholder (can be left empty):',undefined);
	addEntry(labelPage,'divider-string','Divider string (you can use spaces):',undefined);

	//visible fields is a bit more complex
	addLabel(labelPage,'Visible fields and order:',undefined);

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
	visibleFieldsBox.margin_start = 30; //include margin on left to align with rest of widgets
	labelPage.attach(visibleFieldsBox,1,position,1,1);
	position++;

	let showIconComboBox = addStringComboBox(labelPage,'show-icon','Show source icon:',{'off':'','left':'left','right':'right'},"Show icon next to text");

	addButton(labelPage,'Reset label settings', () => {
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

//filters page:
	position = 0;

	addButton(filtersPage,'Show available MPRIS sources', () => {
		sourcesListEntry.set_text(playersToString());
	});

	let sourcesListEntry = new Gtk.Entry({
		visible: true,
		editable: false
	});
	filtersPage.attach(sourcesListEntry,0,position,1,1);
	position++;

	addSubcategoryLabel(filtersPage,'Ignore list:');
	let blacklistEntry = new Gtk.Entry({ visible: true });
	filtersPage.attach(blacklistEntry,0,position,1,1);
	filtersPage._settings.bind('mpris-sources-blacklist',blacklistEntry,'text',Gio.SettingsBindFlags.DEFAULT);
	blacklistEntry.set_placeholder_text('Separate entries with commas');
	blacklistEntry.set_tooltip_text('The sources listed here will not be used');
	position++;

	addSubcategoryLabel(filtersPage,'Allow list:');
	let whitelistEntry = new Gtk.Entry({ visible: true });
	filtersPage.attach(whitelistEntry,0,position,1,1);
	filtersPage._settings.bind('mpris-sources-whitelist',whitelistEntry,'text',Gio.SettingsBindFlags.DEFAULT);
	whitelistEntry.set_placeholder_text('Separate entries with commas');
	whitelistEntry.set_tooltip_text('Only the sources listed here will be used');
	position++;

	//using addSwitch messes up the layout for the other widgets in the page
	let whitelistLabel = buildLabel('Ignore all sources except allowed ones:');
	filtersPage.attach(whitelistLabel,0,position,1,1);
	let whitelistSwitch = new Gtk.Switch({
		valign: Gtk.Align.END,
		halign: Gtk.Align.END,
		visible: true
	});
	filtersPage.attach(whitelistSwitch,0,position,1,1);
	filtersPage._settings.bind('use-whitelisted-sources-only',whitelistSwitch,'active',Gio.SettingsBindFlags.DEFAULT);
	position++;

	addButton(filtersPage,'Reset filters settings', () => {
		settings.reset('mpris-sources-blacklist');
		settings.reset('mpris-sources-whitelist');
		settings.reset('use-whitelisted-sources-only');
	});

	prefsWidget.append_page(panelPage, buildLabel('Panel'));
	prefsWidget.append_page(labelPage, buildLabel('Label'));
	prefsWidget.append_page(filtersPage, buildLabel('Filters'));
	return prefsWidget
}

//functions starting with 'add' adds a widget to the selected grid(or widget)
//functions starting with 'build' creates the "generic" widget and returns it

function addSpinButton(widget,setting,labelstring,lower,upper,labeltooltip){
	log("addSpinButton: "+labeltooltip);
	addLabel(widget,labelstring,labeltooltip);
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

function addStringComboBox(widget,setting,labelstring,options,labeltooltip){
	addLabel(widget,labelstring,labeltooltip);
	thisComboBox = buildStringComboBox(widget._settings,setting,options);
	widget.attach(thisComboBox,1,position,1,1);
	position++;

	return thisComboBox //necessary to reset position when the reset button is clicked
}

function addSwitch(widget,setting,labelstring,labeltooltip){
	addLabel(widget,labelstring,labeltooltip);
	let thisSwitch = new Gtk.Switch({
		valign: Gtk.Align.END,
		halign: Gtk.Align.END,
		visible: true
	});
	widget.attach(thisSwitch,1,position,1,1);
	widget._settings.bind(setting,thisSwitch,'active',Gio.SettingsBindFlags.DEFAULT);
	position++;
}

function addEntry(widget,setting,labelstring,labeltooltip){
	addLabel(widget,labelstring,labeltooltip);
	let thisEntry = new Gtk.Entry({
		visible: true
	});
	widget.attach(thisEntry,1,position,1,1);
	widget._settings.bind(setting,thisEntry,'text',Gio.SettingsBindFlags.DEFAULT);
	position++;
}

function addLabel(widget,labelstring,labeltooltip){
	let thisLabel = buildLabel(labelstring);
	if ( labeltooltip )
		thisLabel.set_tooltip_text(labeltooltip)

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

function addButton(widget,labelstring,callback){
	button = new Gtk.Button({
		label: labelstring,
		visible: true
	});
	widget.attach(button,0,position,1,1);
	button.connect('clicked',callback);
	position++;
}

function addSubcategoryLabel(widget,labelstring){
	labelstring = '<u> ' + labelstring + ' </u>';
	let thisLabel = buildLabel(labelstring);
	widget.attach(thisLabel,0,position,1,1);
	thisLabel.use_markup = true;
	position++;
}

function buildLabel(labelstring){ //don't confuse with label.js buildLabel
	let thisLabel = new Gtk.Label({
		label: labelstring,
		halign: Gtk.Align.START,
		visible: true
	});
	return thisLabel
}

function playersToString(){
	const dBusInterface = `
		<node>
			<interface name="org.freedesktop.DBus">
				<method name="ListNames">
					<arg direction="out" type="as"/>
				</method>
			</interface>
		</node>`

	const dBusProxyWrapper = Gio.DBusProxy.makeProxyWrapper(dBusInterface);
	const dBusProxy = dBusProxyWrapper(Gio.DBus.session,'org.freedesktop.DBus','/org/freedesktop/DBus');

	let list = dBusProxy.ListNamesSync()[0];
	list = list.filter(element => element.startsWith('org.mpris.MediaPlayer2'));

	let newList = [];
	list.forEach(element => {
		element = element.replace('org.mpris.MediaPlayer2.','');
		element = element.replace(/\.instance.*/g,'');
		newList.push(element);
	});

	return newList.toString()
}

