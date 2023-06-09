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

	if(shellVersion >= 40){ //workaround taken directly from gjs.guide
		prefsWidget.connect('realize', () => {
		    let window = prefsWidget.get_root();
		    window.default_width = 600;
		    window.default_height = 700;
		});
	}

//panel page:
	let panelPage = buildGrid(shellVersion,settings);

	addSubcategoryLabel(panelPage,'Icon');
	let showIconComboBox = addStringComboBox(panelPage,'show-icon','Show source icon:',{'off':'','left':'left','right':'right'},undefined);
	addSwitch(panelPage,'use-album','Use album art as icon when available:',undefined);
	addSpinButton(panelPage,'album-size','Album art scaling (in %):',50,250,undefined);

	addSubcategoryLabel(panelPage,'Position');
	let extensionPlaceComboBox = addStringComboBox(panelPage,'extension-place','Extension place:',{'left':'left','center':'center','right':'right'},undefined);
	addSpinButton(panelPage,'extension-index','Extension index:',0,20,"Set widget location within with respect to other adjacent widgets");
	addSpinButton(panelPage,'left-padding','Left padding:',0,500,undefined);
	addSpinButton(panelPage,'right-padding','Right padding:',0,500,undefined);

	addSubcategoryLabel(panelPage,'Wrong index at loadup mitigations');
	addSpinButton(panelPage,'reposition-delay','Panel reposition at startup (delay in seconds):',0,300,"Increase this value if extension index isn't respected at startup");
	addSwitch(panelPage,'reposition-on-button-press','Update panel position on every button press:',undefined);

	addButton(panelPage,'Reset panel settings', () => {
		settings.reset('show-icon');
		settings.reset('left-padding');
		settings.reset('right-padding');
		settings.reset('extension-index');
		settings.reset('extension-place');
		settings.reset('reposition-delay');
		settings.reset('reposition-on-button-press');
		settings.reset('use-album');
		settings.reset('album-size');
		extensionPlaceComboBox.set_active_id(settings.get_string('extension-place'));
		showIconComboBox.set_active_id(settings.get_string('show-icon'));
	});

	prefsWidget.append_page(panelPage, buildLabel('Panel'));

//label page:
	let labelPage = buildGrid(shellVersion,settings);

	position = 0; //this line this line seems to be unnecessary

	addSubcategoryLabel(labelPage,'Behaviour');
	addSwitch(labelPage,'auto-switch-to-most-recent','Switch to the most recent source automatically:',"This option can be annoying without the use of filter lists");
	addSwitch(labelPage,'remove-text-when-paused','Hide when paused:',undefined);
	addSpinButton(labelPage,'remove-text-paused-delay','Hide when paused delay (seconds):',0,10800,undefined);
	addSpinButton(labelPage,'refresh-rate','Refresh rate (milliseconds):',30,3000,undefined);
	addEntry(labelPage,'label-filtered-list','Filter segments containing:',"Separate entries with commas, special characters will be removed\n\nThe targeted segments are defined in code as:\n\t\A substring enclosed by parentheses, square brackets,\n\t or between the end of the string and a hyphen");

	addSubcategoryLabel(labelPage,'Appearance');
	addSpinButton(labelPage,'max-string-length','Max string length (each field):',1,150,undefined);
	addEntry(labelPage,'button-placeholder','Button placeholder (can be left empty):',"The button placeholder is a hint for the user\nAppears when the label is empty and another available source is active");
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


	addButton(labelPage,'Reset label settings', () => {
		settings.reset('max-string-length');
		settings.reset('refresh-rate');
		settings.reset('button-placeholder');
		settings.reset('label-filtered-list');
		settings.reset('divider-string');
		settings.reset('first-field');
		settings.reset('second-field');
		settings.reset('last-field');
		settings.reset('remove-text-when-paused');
		settings.reset('remove-text-paused-delay');
		settings.reset('auto-switch-to-most-recent');
		firstFieldComboBox.set_active_id(settings.get_string('first-field'));
		secondFieldComboBox.set_active_id(settings.get_string('second-field'));
		lastFieldComboBox.set_active_id(settings.get_string('last-field'));
	});

	prefsWidget.append_page(labelPage, buildLabel('Label'));

//filters page:
	let filtersPage = buildGrid(shellVersion,settings);

	position = 0;

	let sourcesListEntry = new Gtk.Entry({
		visible: true,
		editable: false
	});
	filtersPage.attach(sourcesListEntry,0,position,1,1);
	sourcesListEntry.set_text(playersToString());
	position++;

	addButton(filtersPage,'Update list of available MPRIS sources', () => {
		sourcesListEntry.set_text(playersToString());
	});

	addSubcategoryLabel(filtersPage,'Ignore list:');
	let blacklistEntry = new Gtk.Entry({ visible: true });
	filtersPage.attach(blacklistEntry,0,position,1,1);
	filtersPage._settings.bind('mpris-sources-blacklist',blacklistEntry,'text',Gio.SettingsBindFlags.DEFAULT);
	blacklistEntry.set_placeholder_text('Separate entries with commas');
	position++;

	addSubcategoryLabel(filtersPage,'Allow list:');
	let whitelistEntry = new Gtk.Entry({ visible: true });
	filtersPage.attach(whitelistEntry,0,position,1,1);
	filtersPage._settings.bind('mpris-sources-whitelist',whitelistEntry,'text',Gio.SettingsBindFlags.DEFAULT);
	whitelistEntry.set_placeholder_text('Separate entries with commas');
	position++;

	//using addSwitch messes up the layout for the other widgets in the page
	let whitelistLabel = buildLabel('Ignore all sources except allowed ones:');
	whitelistLabel.set_tooltip_text("This option is ignored if the allow list is empty");
	filtersPage.attach(whitelistLabel,0,position,1,1);
	let whitelistSwitch = new Gtk.Switch({
		valign: Gtk.Align.END,
		halign: Gtk.Align.END,
		visible: true
	});
	filtersPage.attach(whitelistSwitch,0,position,1,1);
	filtersPage._settings.bind('use-whitelisted-sources-only',whitelistSwitch,'active',Gio.SettingsBindFlags.DEFAULT);
	position++;

	addSubcategoryLabel(filtersPage,'Players excluded from using album art as icon:');
	let albumBlacklistEntry = new Gtk.Entry({ visible: true });
	filtersPage.attach(albumBlacklistEntry,0,position,1,1);
	filtersPage._settings.bind('album-blacklist',albumBlacklistEntry,'text',Gio.SettingsBindFlags.DEFAULT);
	albumBlacklistEntry.set_placeholder_text('Separate entries with commas');
	position++;

	let filtersPageSubGrid = buildGrid(shellVersion,settings);
	if(shellVersion < 40){
		filtersPageSubGrid.margin = 0;
	}
	else {
		filtersPageSubGrid.margin_top = 0,
		filtersPageSubGrid.margin_bottom = 0,
		filtersPageSubGrid.margin_start = 0,
		filtersPageSubGrid.margin_end = 0
	}
	filtersPage.attach(filtersPageSubGrid,0,position,1,1);

	addButton(filtersPageSubGrid,'Reset filters settings', () => {
		settings.reset('mpris-sources-blacklist');
		settings.reset('mpris-sources-whitelist');
		settings.reset('use-whitelisted-sources-only');
		settings.reset('album-blacklist');
	});

	let placeholderLabel = buildLabel('')//for alignment
	filtersPageSubGrid.attach(placeholderLabel,1,position,1,1);

	prefsWidget.append_page(filtersPage, buildLabel('Filters'));

//controls page:
	let controlsPage = buildGrid(shellVersion,settings);

	position = 0;

	let buttonActions = {
		'open menu':'open-menu','play/pause':'play-pause','next track':'next-track','previous track':'prev-track','next player':'next-player',
		'open app':'activate-player','volume mute':'volume-mute','volume up':'volume-up','volume down':'volume-down','none':'none'
	};

	addSubcategoryLabel(controlsPage,'Mouse bindings');
	let leftClickComboBox = addStringComboBox(controlsPage,'left-click-action','Left click action:',buttonActions,undefined);
	let middleClickComboBox = addStringComboBox(controlsPage,'middle-click-action','Middle click action:',buttonActions,undefined);
	let rightClickComboBox = addStringComboBox(controlsPage,'right-click-action','Right click action:',buttonActions,undefined);
	let scrollComboBox = addStringComboBox(controlsPage,'scroll-action','Scroll up/down action:',{'volume controls':'volume-controls','none':'none'},undefined);
	let thumbForwardComboBox = addStringComboBox(controlsPage,'thumb-forward-action','Thumb-tip button action:',buttonActions,undefined);
	let thumbBackwardComboBox = addStringComboBox(controlsPage,'thumb-backward-action','Inner-thumb button action:',buttonActions,undefined);

	addSubcategoryLabel(controlsPage,'Behaviour');
	let VolumeControlComboBox = addStringComboBox(controlsPage,'volume-control-scheme','Volume control scheme:',{'application':'application','global':'global'},undefined);

	addButton(controlsPage,'Reset controls settings',() => {
		settings.reset('left-click-action');
		settings.reset('middle-click-action');
		settings.reset('right-click-action');
		settings.reset('scroll-action');
		settings.reset('thumb-forward-action');
		settings.reset('thumb-backward-action');
		settings.reset('volume-control-scheme');
		leftClickComboBox.set_active_id(settings.get_string('left-click-action'));
		middleClickComboBox.set_active_id(settings.get_string('middle-click-action'));
		rightClickComboBox.set_active_id(settings.get_string('right-click-action'));
		scrollComboBox.set_active_id(settings.get_string('scroll-action'));
		thumbForwardComboBox.set_active_id(settings.get_string('thumb-forward-action'));
		thumbBackwardComboBox.set_active_id(settings.get_string('thumb-backward-action'));
		VolumeControlComboBox.set_active_id(settings.get_string('volume-control-scheme'));
	});

	prefsWidget.append_page(controlsPage, buildLabel('Controls'));

	return prefsWidget
}

//functions starting with 'add' adds a widget to the selected grid(or widget)
//functions starting with 'build' creates the "generic" widget and returns it

function addSpinButton(widget,setting,labelstring,lower,upper,labeltooltip){
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
		halign: Gtk.Align.FILL,
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

		const entryInterface = `
		<node>
			<interface name="org.mpris.MediaPlayer2">
				<property name="Identity" type="s" access="read"/>
			</interface>
		</node>`
		
	const dBusProxyWrapper = Gio.DBusProxy.makeProxyWrapper(dBusInterface);
	const dBusProxy = dBusProxyWrapper(Gio.DBus.session,'org.freedesktop.DBus','/org/freedesktop/DBus');

	let list = dBusProxy.ListNamesSync()[0];
	list = list.filter(element => element.startsWith('org.mpris.MediaPlayer2'));

	let entryWrapper = Gio.DBusProxy.makeProxyWrapper(entryInterface);

	let newList = [];
	list.forEach(element => {
		entryProxy = entryWrapper(Gio.DBus.session,element,"/org/mpris/MediaPlayer2");
		let identity = entryProxy.Identity;
		newList.push(identity);
	});

	return newList.toString()
}

