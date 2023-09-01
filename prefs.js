const {Adw,Gio,Gtk} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Config = imports.misc.config;

let position = 0;

function init(){}

function fillPreferencesWindow(window){
	window.default_width = 600;
	window.default_height = 950;

	// const [major] = Config.PACKAGE_VERSION.split('.');
	// const shellVersion = Number.parseInt(major);

	let settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');
	let page,group;

//panel page:
	let panelPage = buildGrid(settings);
	page = addPreferencesPage(window,'Panel',panelPage,'computer-symbolic');
	
	group = new Adw.PreferencesGroup({ title: 'Icon'});
	page.add(group);

	let showIconComboBox = addStringComboBox2(panelPage,'show-icon','Show source icon:',{'off':'','left':'left','right':'right'},undefined,group);
	addSpinButton(panelPage, 'icon-padding', 'Icon padding:', 0, 50, undefined,group);
	addSwitch(panelPage, 'symbolic-source-icon', 'Use symbolic source icon:', "Uses an icon that follows the shell's color scheme",group);
	addSwitch(panelPage,'use-album','Use album art as icon when available:',undefined,group);
	addSpinButton(panelPage,'album-size','Album art scaling (in %):',20,250,undefined,group);

	group = new Adw.PreferencesGroup({ title: 'Position'});
	page.add(group);
	let extensionPlaceComboBox = addStringComboBox2(panelPage,'extension-place','Extension place:',{'left':'left','center':'center','right':'right'},undefined,group);
	addSpinButton(panelPage,'extension-index','Extension index:',0,20,"Set widget location within with respect to other adjacent widgets",group);
	addSpinButton(panelPage,'left-padding','Left padding:',0,500,undefined,group);
	addSpinButton(panelPage,'right-padding','Right padding:',0,500,undefined,group);

	group = new Adw.PreferencesGroup({ title: 'Wrong index at loadup mitigations'});
	page.add(group);
	addSpinButton(panelPage,'reposition-delay','Panel reposition at startup (delay in seconds):',0,300,"Increase this value if extension index isn't respected at startup",group);
	addSwitch(panelPage,'reposition-on-button-press','Update panel position on every button press:',undefined,group);

	//Reset Button
	addButton(panelPage,'Reset Panel settings', () => {
		settings.reset('show-icon');
		settings.reset('left-padding');
		settings.reset('right-padding');
		settings.reset('extension-index');
		settings.reset('extension-place');
		settings.reset('reposition-delay');
		settings.reset('reposition-on-button-press');
		settings.reset('use-album');
		settings.reset('album-size');
		settings.reset('symbolic-source-icon');
		settings.reset('icon-padding');
		extensionPlaceComboBox.set_active_id(settings.get_string('extension-place'));
		showIconComboBox.set_active_id(settings.get_string('show-icon'));
	},group);

//label page:
	let labelPage = buildGrid(settings);
	page = addPreferencesPage(window,'Label',labelPage,'document-edit-symbolic');

	group = new Adw.PreferencesGroup({ title: 'Behaviour'});
	page.add(group);
	addSwitch(labelPage,'auto-switch-to-most-recent','Switch to the most recent source automatically:',"This option can be annoying without the use of filter lists",group);
	addSwitch(labelPage,'remove-text-when-paused','Hide when paused:',undefined,group);
	addSpinButton(labelPage,'remove-text-paused-delay','Hide when paused delay (seconds):',0,10800,undefined,group);
	addSpinButton(labelPage,'refresh-rate','Refresh rate (milliseconds):',30,3000,undefined,group);
	addEntry2(labelPage,'label-filtered-list','Filter segments containing:',"Separate entries with commas, special characters will be removed\n\nThe targeted segments are defined in code as:\n\t\A substring enclosed by parentheses, square brackets,\n\t or between the end of the string and a hyphen",group);

	group = new Adw.PreferencesGroup({ title: 'Appearance'});
	page.add(group);
	addSpinButton(labelPage,'max-string-length','Max string length (each field):',1,150,undefined,group);
	addEntry2(labelPage,'button-placeholder','Button placeholder (can be left empty):',"The button placeholder is a hint for the user\nAppears when the label is empty and another available source is active",group);
	addEntry2(labelPage,'divider-string','Divider string (you can use spaces):',undefined,group);

	//triple comboBox done manually
	let fieldOptions = {'artist':'xesam:artist','album':'xesam:album','title':'xesam:title'};
	let firstFieldComboBox = buildStringComboBox(settings,'first-field',fieldOptions);
	fieldOptions['none'] = '';
	let secondFieldComboBox = buildStringComboBox(settings,'second-field',fieldOptions);
	let lastFieldComboBox = buildStringComboBox(settings,'last-field',fieldOptions);

	let row = new Adw.ActionRow({ title: 'Visible fields and order:' });
	row.add_suffix(firstFieldComboBox);
	row.add_suffix(secondFieldComboBox);
	row.add_suffix(lastFieldComboBox);
	group.add(row);

	//Reset Button
	addButton(labelPage,'Reset Label settings', () => {
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
	},group);

	
//filters page:
	let filtersPage = buildGrid(settings);
	page = addPreferencesPage(window,'Filters',filtersPage,'dialog-error-symbolic');

	position = 0;
	group = new Adw.PreferencesGroup({ title: 'List of available MPRIS Sources:' });
	page.add(group);

	let sourcesListEntry = new Gtk.Entry({
		visible: true,
		editable: false
	});
	group.add(sourcesListEntry);
	sourcesListEntry.set_text(playersToString());

	addButton(filtersPage,'Update list of available MPRIS sources', () => {
		sourcesListEntry.set_text(playersToString());
	},group);

	group = new Adw.PreferencesGroup({ title: 'Ignore list:'});
	page.add(group);

	let blacklistEntry = new Gtk.Entry({ visible: true });
	group.add(blacklistEntry);
	filtersPage._settings.bind('mpris-sources-blacklist',blacklistEntry,'text',Gio.SettingsBindFlags.DEFAULT);
	blacklistEntry.set_placeholder_text('Separate entries with commas');

	group = new Adw.PreferencesGroup({ title: 'Allow list:'});
	page.add(group);

	addSwitch(filtersPage,'use-whitelisted-sources-only','Ignore all sources except allowed ones:',"This option is ignored if the allow list is empty",group);
	
	let whitelistEntry = new Gtk.Entry({ visible: true, margin_top: 10 });
	filtersPage._settings.bind('mpris-sources-whitelist',whitelistEntry,'text',Gio.SettingsBindFlags.DEFAULT);
	whitelistEntry.set_placeholder_text('Separate entries with commas');
	group.add(whitelistEntry);

	group = new Adw.PreferencesGroup({ title: 'Players excluded from using album art as icon:'});
	page.add(group);

	let albumBlacklistEntry = new Gtk.Entry({ visible: true });
	group.add(albumBlacklistEntry);
	filtersPage._settings.bind('album-blacklist',albumBlacklistEntry,'text',Gio.SettingsBindFlags.DEFAULT);
	albumBlacklistEntry.set_placeholder_text('Separate entries with commas');

	//Reset Button
	addButton(filtersPage,'Reset Filters settings', () => {
		settings.reset('mpris-sources-blacklist');
		settings.reset('mpris-sources-whitelist');
		settings.reset('use-whitelisted-sources-only');
		settings.reset('album-blacklist');
	},group);

//controls page:
	let controlsPage = buildGrid(settings);
	page = addPreferencesPage(window,'Controls',controlsPage,'input-mouse-symbolic');

	position = 0;

	let buttonActions = {
		'open menu':'open-menu','play/pause':'play-pause','next track':'next-track','previous track':'prev-track','next player':'next-player',
		'open app':'activate-player','volume mute':'volume-mute','volume up':'volume-up','volume down':'volume-down','none':'none'
	};

	group = new Adw.PreferencesGroup({ title: 'Double Click'});
	page.add(group);

	addSwitch(controlsPage, 'enable-double-clicks', 'Enable double clicks:', undefined, group);
	let doubleClickTime = addSpinButton(controlsPage, 'double-click-time', 'Double click time (milliseconds):', 1, 1000, undefined, group);

	group = new Adw.PreferencesGroup({ title: 'Mouse bindings'});
	page.add(group);

	row = new Adw.ActionRow({ title: ''});
	let thisLabel = new Gtk.Label({
		label: 'Single click',
		width_chars: 17
	});
	row.add_suffix(thisLabel);
	thisLabel = new Gtk.Label({
		label: 'Double click',
		width_chars: 17
	});
	row.add_suffix(thisLabel);
	group.add(row);

	let [leftClickComboBox, leftDoubleClickComboBox] = addDoubleStringComboBox2(controlsPage,'left-click-action','left-double-click-action','Left click action:',buttonActions,undefined,group);
	let [middleClickComboBox, middleDoubleClickComboBox] = addDoubleStringComboBox2(controlsPage,'middle-click-action','middle-double-click-action','Middle click action:',buttonActions,undefined,group);
	let [rightClickComboBox, rightDoubleClickComboBox] = addDoubleStringComboBox2(controlsPage,'right-click-action','right-double-click-action','Right click action:',buttonActions,undefined,group);
	let [thumbForwardComboBox, thumbDoubleForwardComboBox] = addDoubleStringComboBox2(controlsPage,'thumb-forward-action','thumb-double-forward-action','Thumb-tip button action:',buttonActions,undefined,group);
	let [thumbBackwardComboBox, thumbDoubleBackwardComboBox] = addDoubleStringComboBox2(controlsPage,'thumb-backward-action','thumb-double-backward-action','Inner-thumb button action:',buttonActions,undefined,group);

	group = new Adw.PreferencesGroup({ title: ''});
	page.add(group);
	let scrollComboBox = addStringComboBox2(controlsPage,'scroll-action','Scroll up/down action:',{'volume controls':'volume-controls','none':'none'},undefined,group);

	group = new Adw.PreferencesGroup({ title: 'Behaviour'});
	page.add(group);
	let VolumeControlComboBox = addStringComboBox2(controlsPage,'volume-control-scheme','Volume control scheme:',{'application':'application','global':'global'},undefined,group);

	//Reset Button
	addButton(controlsPage,'Reset Controls settings',() => {
		settings.reset('enable-double-clicks');
		settings.reset('double-click-time');
		settings.reset('left-click-action');
		settings.reset('left-double-click-action');
		settings.reset('middle-click-action');
		settings.reset('middle-double-click-action');
		settings.reset('right-click-action');
		settings.reset('right-double-click-action');
		settings.reset('scroll-action');
		settings.reset('thumb-forward-action');
		settings.reset('thumb-double-forward-action');
		settings.reset('thumb-backward-action');
		settings.reset('thumb-double-backward-action');
		settings.reset('volume-control-scheme');
		leftClickComboBox.set_active_id(settings.get_string('left-click-action'));
		leftDoubleClickComboBox.set_active_id(settings.get_string('left-double-click-action'));
		middleClickComboBox.set_active_id(settings.get_string('middle-click-action'));
		middleDoubleClickComboBox.set_active_id(settings.get_string('middle-double-click-action'));
		rightClickComboBox.set_active_id(settings.get_string('right-click-action'));
		rightDoubleClickComboBox.set_active_id(settings.get_string('right-double-click-action'));
		scrollComboBox.set_active_id(settings.get_string('scroll-action'));
		thumbForwardComboBox.set_active_id(settings.get_string('thumb-forward-action'));
		thumbDoubleForwardComboBox.set_active_id(settings.get_string('thumb-double-forward-action'));
		thumbBackwardComboBox.set_active_id(settings.get_string('thumb-backward-action'));
		thumbDoubleBackwardComboBox.set_active_id(settings.get_string('thumb-double-backward-action'));
		VolumeControlComboBox.set_active_id(settings.get_string('volume-control-scheme'));
	},group);

	[doubleClickTime, leftDoubleClickComboBox, middleDoubleClickComboBox, rightDoubleClickComboBox, thumbDoubleForwardComboBox, thumbDoubleBackwardComboBox]
		.forEach(el => bindEnabled(controlsPage._settings, 'enable-double-clicks', el));
}

//functions starting with 'add' adds a widget to the selected grid(or widget)
//functions starting with 'build' creates the "generic" widget and returns it

function addPreferencesPage(window,name,widget,icon){
	let thisPage = new Adw.PreferencesPage({
		name: name,
		title: name,
		icon_name: icon,
	});
	window.add(thisPage);
	return thisPage
}

function addSpinButton(widget,setting,labelstring,lower,upper,labeltooltip,group){
	let row = new Adw.ActionRow({ title: labelstring });
	if (labeltooltip)
		row.subtitle = labeltooltip;

	let thisSpinButton = new Gtk.SpinButton({
		adjustment: new Gtk.Adjustment({
			lower: lower,
			upper: upper,
			step_increment: 1
		}),
		valign: Gtk.Align.CENTER,
		halign: Gtk.Align.END,
		visible: true
	});

	widget._settings.bind(setting,thisSpinButton,'value',Gio.SettingsBindFlags.DEFAULT);

	row.add_suffix(thisSpinButton);
	group.add(row);
	return thisSpinButton;
}

function addStringComboBox(widget,setting,labelstring,options,labeltooltip,width=1){
	addLabel(widget,labelstring,labeltooltip);
	thisComboBox = buildStringComboBox(widget._settings,setting,options);
	widget.attach(thisComboBox,1,position,width,1);
	position++;

	return thisComboBox //necessary to reset position when the reset button is clicked
}

function addStringComboBox2(widget,setting,labelstring,options,labeltooltip,group){
	let row = new Adw.ActionRow({ title: labelstring });
	if (labeltooltip)
		row.subtitle = labeltooltip;

	thisComboBox = buildStringComboBox(widget._settings,setting,options);

	row.add_suffix(thisComboBox);
	group.add(row);

	return thisComboBox //necessary to reset position when the reset button is clicked
}

function addToggleButton(widget,setting,labelstring,options,labeltooltip,group){
	let row = new Adw.ActionRow({ title: labelstring });
	if (labeltooltip)
		row.subtitle = labeltooltip;

	thisComboBox = buildToggleButton(widget._settings,setting,options);

	row.add_suffix(thisComboBox);
	group.add(row);

	return thisComboBox //necessary to reset position when the reset button is clicked
}

function addDoubleStringComboBox(widget, setting1, setting2, labelstring, options, labeltooltip){
	addLabel(widget, labelstring, labeltooltip, 2);

	comboBox1 = buildStringComboBox(widget._settings, setting1, options);
	widget.attach(comboBox1, 1, position, 1, 1);

	comboBox2 = buildStringComboBox(widget._settings, setting2, options);
	widget.attach(comboBox2, 2, position, 1, 1);

	position++;

	return [comboBox1, comboBox2]
}

function addDoubleStringComboBox2(widget, setting1, setting2, labelstring, options, labeltooltip,group){
	let row = new Adw.ActionRow({ title: labelstring });
	if (labeltooltip)
		row.subtitle = labeltooltip;

	comboBox1 = buildStringComboBox(widget._settings, setting1, options);
	row.add_suffix(comboBox1);

	comboBox2 = buildStringComboBox(widget._settings, setting2, options);
	row.add_suffix(comboBox2);
	group.add(row)

	return [comboBox1, comboBox2]
}

function addSwitch(widget,setting,labelstring,labeltooltip,group){
	let row = new Adw.ActionRow({ title: labelstring });
	if (labeltooltip)
		row.subtitle = labeltooltip;

	let thisSwitch = new Gtk.Switch({
		valign: Gtk.Align.CENTER,
		halign: Gtk.Align.END,
		visible: true
	});
	widget._settings.bind(setting,thisSwitch,'active',Gio.SettingsBindFlags.DEFAULT);

	row.add_suffix(thisSwitch);
	group.add(row)
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

function addEntry2(widget,setting,labelstring,labeltooltip,group){
	let row = new Adw.ActionRow({ title: labelstring });
	if ( labeltooltip ){
		if (labeltooltip.length>50){
			let thisInfo = new Gtk.MenuButton({
				valign: Gtk.Align.CENTER,
				icon_name: 'info-symbolic',
				visible: true
			});
			let thisPopover = new Gtk.Popover();
			let thisLabel = new Gtk.Label({
				label: labeltooltip
			});
			thisPopover.set_child(thisLabel);
			thisInfo.set_popover(thisPopover);
			row.add_suffix(thisInfo);
		}
		else
			row.subtitle = labeltooltip;
	}

	let thisEntry = new Gtk.Entry({
		valign: Gtk.Align.CENTER,
		halign: Gtk.Align.END,
		visible: true
	});
	widget._settings.bind(setting,thisEntry,'text',Gio.SettingsBindFlags.DEFAULT);

	row.add_suffix(thisEntry);
	group.add(row)
}

function addLabel(widget,labelstring,labeltooltip){
	let thisLabel = buildLabel(labelstring);
	if ( labeltooltip )
		thisLabel.set_tooltip_text(labeltooltip)

	widget.attach(thisLabel,0,position,1,1);
}

function buildStringComboBox(settings,setting,options){
	let thisComboBox = new Gtk.ComboBoxText({//consider using Adw.ComboRow
		valign: Gtk.Align.CENTER,
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

function buildToggleButton(settings,setting,options){
	let thisToggleButton = new Gtk.ToggleButton({
		valign: Gtk.Align.CENTER,
		halign: Gtk.Align.END,
		group:true,
		visible: true
	});
	for (let option in options){
		thisToggleButton.append(options[option],option);
	}
	thisToggleButton.set_active_id(settings.get_string(setting));
	thisToggleButton.connect('changed', () => {
		settings.set_string(setting,thisComboBox.get_active_id());
	});
	thisToggleButton.gtk_toggle_button_set_group = true

	return thisToggleButton
}

function buildGrid(settings){
	let grid = new Gtk.Grid({
		margin_top: 10,
		margin_bottom: 10,
		margin_start: 10,
		margin_end: 10,
		column_spacing: 12,
		row_spacing: 12,
		visible: true,
		column_homogeneous: true
	});
	grid._settings = settings;
	return grid
}

function addButton(widget,labelstring,callback,group){
	button = new Gtk.Button({
		label: labelstring,
		margin_top: 30,
		visible: true
	});
	button.connect('clicked',callback);
	group.add(button);
}

function addSubcategoryLabel(widget,labelstring){
	labelstring = '<u> ' + labelstring + ' </u>';
	let thisLabel = buildLabel(labelstring,true);
	widget.attach(thisLabel,0,position,1,1);
	position++;
}

function buildLabel(labelstring, use_markup=false){ //don't confuse with label.js buildLabel
	let thisLabel = new Gtk.Label({
		label: labelstring,
		halign: Gtk.Align.START,
		visible: true
	});
	thisLabel.use_markup = use_markup
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

function bindEnabled(settings, setting, element) {
	settings.bind(setting, element, 'sensitive', Gio.SettingsBindFlags.GET);
}

