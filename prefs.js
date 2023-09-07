const {Adw,Gio,Gtk} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Config = imports.misc.config;
const settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');

function init(){}

function fillPreferencesWindow(window){
	// window.default_width = 650;
	window.default_height = 950;

	// const [major] = Config.PACKAGE_VERSION.split('.');
	// const shellVersion = Number.parseInt(major);

	let page,group;

//panel page:
	page = addPreferencesPage(window,'Panel','computer-symbolic');

	group = new Adw.PreferencesGroup({ title: 'Icon'});
	page.add(group);

	let showIconComboBox = addStringComboBox(group,'show-icon','Show source icon',{'off':'','left':'left','right':'right'},undefined);
	addSpinButton(group, 'icon-padding', 'Icon padding', 0, 50, undefined);
	addSwitch(group, 'symbolic-source-icon', 'Use symbolic source icon', "Uses an icon that follows the shell's color scheme");
	addSwitch(group,'use-album','Use album art as icon when available',undefined);
	addSpinButton(group,'album-size','Album art scaling (in %)',20,250,undefined);

	group = new Adw.PreferencesGroup({ title: 'Position'});
	page.add(group);
	let extensionPlaceComboBox = addStringComboBox(group,'extension-place','Extension place',{'left':'left','center':'center','right':'right'},undefined);
	addSpinButton(group,'extension-index','Extension index',0,20,"Set widget location within with respect to other adjacent widgets");
	addSpinButton(group,'left-padding','Left padding',0,500,undefined);
	addSpinButton(group,'right-padding','Right padding',0,500,undefined);

	group = new Adw.PreferencesGroup({ title: 'Wrong index at loadup mitigations'});
	page.add(group);
	addSpinButton(group,'reposition-delay','Panel reposition at startup (delay in seconds)',0,300,"Increase this value if extension index isn't respected at startup");
	addSwitch(group,'reposition-on-button-press','Update panel position on every button press',undefined);

	//Reset Button
	addButton(group,'Reset Panel settings', () => {
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
	});

//label page:
	page = addPreferencesPage(window,'Label','document-edit-symbolic');

	group = new Adw.PreferencesGroup({ title: 'Behaviour'});
	page.add(group);
	addSwitch(group,'auto-switch-to-most-recent','Switch to the most recent source automatically',"This option can be annoying without the use of filter lists");
	addSwitch(group,'remove-text-when-paused','Hide when paused',undefined);
	addSpinButton(group,'remove-text-paused-delay','Hide when paused delay (seconds)',0,9999,undefined);
	addSpinButton(group,'refresh-rate','Refresh rate (milliseconds)',30,3000,undefined);
	addEntry(group,'label-filtered-list','Filter segments containing',"Separate entries with commas, special characters will be removed\n\nThe targeted segments are defined in code as:\n\t\A substring enclosed by parentheses, square brackets,\n\t or between the end of the string and a hyphen");

	group = new Adw.PreferencesGroup({ title: 'Appearance'});
	page.add(group);
	addSpinButton(group,'max-string-length','Max string length (each field)',1,150,undefined);
	addEntry(group,'button-placeholder','Button placeholder',"The button placeholder is a hint for the user and can be left empty.\n\nIt appears when the label is empty and another available source is active");
	addEntry(group,'divider-string','Divider string (you can use spaces)',undefined);

	let fieldOptions1 = {'artist':'xesam:artist','album':'xesam:album','title':'xesam:title'};
	let fieldOptions2 = {'artist':'xesam:artist','album':'xesam:album','title':'xesam:title','none':''};
	let fieldOptions3 = {'artist':'xesam:artist','album':'xesam:album','title':'xesam:title','none':''};
	let [firstFieldComboBox, secondFieldComboBox, lastFieldComboBox] = addTripleStringComboBox(group,'first-field','second-field','last-field','Visible fields and order',fieldOptions1,fieldOptions2,fieldOptions3,undefined);

	//Reset Button
	addButton(group,'Reset Label settings', () => {
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

//filters page:
	page = addPreferencesPage(window,'Filters','dialog-error-symbolic');

	group = new Adw.PreferencesGroup({ title: 'List of available MPRIS Sources'});
	page.add(group);

	let sourcesListEntry = addWideEntry(group,undefined,'',"Press the button below to update");
	sourcesListEntry.set_text(playersToString());
	sourcesListEntry.set_editable(false);

	let updateButton = addButton(group,'Update list of available MPRIS sources', () => {
		sourcesListEntry.set_text(playersToString());
	});
	updateButton.set_margin_top(10);

	group = new Adw.PreferencesGroup({ title: 'Ignore list'});
	page.add(group);
	addWideEntry(group,'mpris-sources-blacklist','Separate entries with commas',undefined);

	group = new Adw.PreferencesGroup({ title: 'Allow list'});
	page.add(group);
	addSwitch(group,'use-whitelisted-sources-only','Ignore all sources except allowed ones',"This option is ignored if the allow list is empty");
	let allowListEntry = addWideEntry(group,'mpris-sources-whitelist','Separate entries with commas',undefined);
	allowListEntry.set_margin_top(10);

	group = new Adw.PreferencesGroup({ title: 'Players excluded from using album art as icon'});
	page.add(group);
	addWideEntry(group,'album-blacklist','Separate entries with commas',undefined);

	//Reset Button
	addButton(group,'Reset Filters settings', () => {
		settings.reset('mpris-sources-blacklist');
		settings.reset('mpris-sources-whitelist');
		settings.reset('use-whitelisted-sources-only');
		settings.reset('album-blacklist');
	});

//controls page:
	page = addPreferencesPage(window,'Controls','input-mouse-symbolic');

	let buttonActions = {
		'open menu':'open-menu','play/pause':'play-pause','next track':'next-track','previous track':'prev-track','next player':'next-player',
		'open app':'activate-player','volume mute':'volume-mute','volume up':'volume-up','volume down':'volume-down','none':'none'
	};

	group = new Adw.PreferencesGroup({ title: 'Double Click'});
	page.add(group);

	addSwitch(group, 'enable-double-clicks', 'Enable double clicks', undefined);
	let doubleClickTime = addSpinButton(group, 'double-click-time', 'Double click time (milliseconds)', 1, 1000, undefined);

	group = new Adw.PreferencesGroup({ title: 'Mouse bindings'});
	page.add(group);

	row = new Adw.ActionRow({ title: ''});
	let singleClickLabel = new Gtk.Label({ //not sure how to underline or reduce height
		label: 'Single click',
		width_chars: 15
	});
	row.add_suffix(singleClickLabel);
	doubleClickLabel = new Gtk.Label({
		label: 'Double click',
		width_chars: 28
	});
	row.add_suffix(doubleClickLabel);
	group.add(row);

	let [leftClickComboBox, leftDoubleClickComboBox] = addDoubleStringComboBox(group,'left-click-action','left-double-click-action','Left click',buttonActions,undefined);
	let [middleClickComboBox, middleDoubleClickComboBox] = addDoubleStringComboBox(group,'middle-click-action','middle-double-click-action','Middle click',buttonActions,undefined,);
	let [rightClickComboBox, rightDoubleClickComboBox] = addDoubleStringComboBox(group,'right-click-action','right-double-click-action','Right click',buttonActions,undefined);
	let [thumbForwardComboBox, thumbDoubleForwardComboBox] = addDoubleStringComboBox(group,'thumb-forward-action','thumb-double-forward-action','Thumb-tip button',buttonActions,undefined);
	let [thumbBackwardComboBox, thumbDoubleBackwardComboBox] = addDoubleStringComboBox(group,'thumb-backward-action','thumb-double-backward-action','Inner-thumb button',buttonActions,undefined);

	group = new Adw.PreferencesGroup({ title: ''});
	page.add(group);
	let scrollComboBox = addStringComboBox(group,'scroll-action','Scroll up/down',{'volume control':'volume-controls','none':'none'},undefined);
	scrollComboBox.set_size_request(140,-1); //match size with next button

	group = new Adw.PreferencesGroup({ title: 'Behaviour'});
	page.add(group);
	let VolumeControlComboBox = addStringComboBox(group,'volume-control-scheme','Volume control scheme',{'application':'application','global':'global'},undefined);
	VolumeControlComboBox.set_size_request(140,-1); //match size with previous button

	//Reset Button
	addButton(group,'Reset Controls settings',() => {
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
	});

	[doubleClickTime, doubleClickLabel, leftDoubleClickComboBox, middleDoubleClickComboBox, rightDoubleClickComboBox, thumbDoubleForwardComboBox, thumbDoubleBackwardComboBox]
		.forEach(el => bindEnabled(settings, 'enable-double-clicks', el));
}

//functions starting with 'add' adds a widget to the selected grid(or widget)
//functions starting with 'build' creates the "generic" widget and returns it

function addPreferencesPage(window,name,icon){
	let thisPage = new Adw.PreferencesPage({
		name: name,
		title: name,
		icon_name: icon,
	});
	window.add(thisPage);
	return thisPage
}

function buildActionRow(labelstring,labeltooltip){
	let row = new Adw.ActionRow({ title: labelstring });
	if ( labeltooltip ){
		if (labeltooltip.length>70){ //could make every tooltip a button if preferred
			let thisInfoButton = buildInfoButton(labeltooltip);
			row.add_suffix(thisInfoButton);
		}
		else
			row.subtitle = labeltooltip;
	}

	return row;
}

function buildInfoButton(labeltooltip){
	let thisInfoButton = new Gtk.MenuButton({
		valign: Gtk.Align.CENTER,
		icon_name: 'info-symbolic',
		visible: true
	});
	thisInfoButton.add_css_class('flat');
	// thisInfoButton.add_css_class('circular');
	let thisPopover = new Gtk.Popover();
	let thisLabel = new Gtk.Label({
		label: labeltooltip
	});
	thisPopover.set_child(thisLabel);
	thisInfoButton.set_popover(thisPopover);

	return thisInfoButton;
}

function buildResetButton(setting,combobox){
	let thisResetButton = new Gtk.Button({
		valign: Gtk.Align.CENTER,
		icon_name: 'edit-clear-symbolic-rtl',
		visible: false
	});

	//hide if default setting
	if (settings.get_string(setting))
		thisResetButton.set_visible(true);

	thisResetButton.add_css_class('flat');
	thisResetButton.set_tooltip_text('Reset to Default');
	if (combobox)
		thisResetButton.connect('clicked',() => {
			settings.reset(setting);
			combobox.set_active_id(settings.get_string(setting));
			thisResetButton.set_visible(false);
		});
	else {
		thisResetButton.connect('clicked',() => {
			settings.reset(setting);
			thisResetButton.set_visible(false)
		});
	}

	return thisResetButton;
}

function addSpinButton(group,setting,labelstring,lower,upper,labeltooltip){
	let row = buildActionRow(labelstring,labeltooltip);

	let resetButton = buildResetButton(setting);

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
	settings.bind(setting,thisSpinButton,'value',Gio.SettingsBindFlags.DEFAULT);

	row.add_suffix(resetButton);
	row.add_suffix(thisSpinButton);

	thisSpinButton.connect('changed',() => {resetButton.set_visible(true)})

	group.add(row);
	return thisSpinButton;
}

function addStringComboBox(group,setting,labelstring,options,labeltooltip){
	let row = buildActionRow(labelstring,labeltooltip);

	thisComboBox = buildStringComboBox(settings,setting,options,105); //105 preferred width to align with spinbuttons
	let resetButton = buildResetButton(setting);

	row.add_suffix(resetButton,thisComboBox);
	row.add_suffix(thisComboBox);

	thisComboBox.connect('changed',() => {resetButton.set_visible(true)})
	group.add(row);

	return thisComboBox //necessary to reset position when the reset button is clicked
}

function addDoubleStringComboBox(group, setting1, setting2, labelstring, options, labeltooltip){
	let row = buildActionRow(labelstring,labeltooltip);

	comboBox1 = buildStringComboBox(settings, setting1, options);
	row.add_suffix(buildResetButton(setting1),comboBox1);
	row.add_suffix(comboBox1);

	comboBox2 = buildStringComboBox(settings, setting2, options);
	row.add_suffix(buildResetButton(setting2),comboBox2);
	row.add_suffix(comboBox2);

	group.add(row)

	return [comboBox1, comboBox2]
}

function addTripleStringComboBox(group, setting1, setting2, setting3, labelstring, options1, options2, options3, labeltooltip){
	let row = buildActionRow(labelstring,labeltooltip);

	comboBox1 = buildStringComboBox(settings, setting1, options1);
	row.add_suffix(comboBox1);

	comboBox2 = buildStringComboBox(settings, setting2, options2);
	row.add_suffix(comboBox2);

	comboBox3 = buildStringComboBox(settings, setting3, options3);
	row.add_suffix(comboBox3);

	group.add(row)
	return [comboBox1, comboBox2, comboBox3]
}

function addSwitch(group,setting,labelstring,labeltooltip){
	let row = buildActionRow(labelstring,labeltooltip);

	let resetButton = buildResetButton(setting);
	row.add_suffix(resetButton);

	let thisSwitch = new Gtk.Switch({
		valign: Gtk.Align.CENTER,
		halign: Gtk.Align.END,
		visible: true
	});
	settings.bind(setting,thisSwitch,'active',Gio.SettingsBindFlags.DEFAULT);
	row.add_suffix(thisSwitch);

	thisSwitch.connect('state-set',() => {resetButton.set_visible(true)})

	group.add(row)
}

function addEntry(group,setting,labelstring,labeltooltip){
	let row = buildActionRow(labelstring,labeltooltip);

	let resetButton = buildResetButton(setting);
	row.add_suffix(resetButton);

	let thisEntry = new Gtk.Entry({
		valign: Gtk.Align.CENTER,
		halign: Gtk.Align.END,
		width_request: 215,
		visible: true
	});
	settings.bind(setting,thisEntry,'text',Gio.SettingsBindFlags.DEFAULT);
	row.add_suffix(thisEntry);

	thisEntry.connect('changed',() => {resetButton.set_visible(true)})

	group.add(row)
}

function addWideEntry(group,setting,placeholder,labeltooltip){
	let thisEntry = new Gtk.Entry({ 
		visible: true,
		secondary_icon_name: '',
		secondary_icon_tooltip_text: "Reset to Default"
	});
	if ( labeltooltip )
		thisEntry.set_tooltip_text(labeltooltip)

	if (setting){
		settings.bind(setting,thisEntry,'text',Gio.SettingsBindFlags.DEFAULT);
		thisEntry.connect('icon-press',() => {
			thisEntry.set_icon_from_icon_name(1,'');
			settings.reset(setting)
		});

		thisEntry.connect('changed',() => {	thisEntry.set_icon_from_icon_name(1,'edit-clear-symbolic');	})

		if (settings.get_string(setting))
			thisEntry.set_icon_from_icon_name(1,'edit-clear-symbolic');
	}

	thisEntry.set_placeholder_text(placeholder);
	group.add(thisEntry);

	return thisEntry;
}

function buildStringComboBox(settings,setting,options,width){
	let thisComboBox = new Gtk.ComboBoxText({//consider using Adw.ComboRow
		valign: Gtk.Align.CENTER,
		halign: Gtk.Align.END,
		visible: true
	});
	if (width)
		thisComboBox.set_size_request(105,-1);

	for (let option in options){
		thisComboBox.append(options[option],option);
	}
	thisComboBox.set_active_id(settings.get_string(setting));
	thisComboBox.connect('changed', () => {
		settings.set_string(setting,thisComboBox.get_active_id());
	});

	return thisComboBox
}

function addButton(group,labelstring,callback){
	button = new Gtk.Button({
		label: labelstring,
		margin_top: 30,
		visible: true
	});
	button.connect('clicked',callback);
	group.add(button);

	return button
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

