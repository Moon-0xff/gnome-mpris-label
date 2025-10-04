import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

function init(){}

export default class MprisLabelPreferences extends ExtensionPreferences {
fillPreferencesWindow(window){
	const settings = this.getSettings();
	window.default_height = 960;

//panel page:
	let page = addPreferencesPage(window,'Panel','computer-symbolic');

	let group = addGroup(page,'Icon');
	let [showIconDropDown] = addDropDown(settings,group,'show-icon','Show source icon',{'off':'','left':'left','right':'right'},undefined);
	addSpinButton(settings,group,'icon-padding', 'Icon padding', 0, 50, undefined);
	addSwitch(settings,group,'symbolic-source-icon', 'Use symbolic source icon', "Uses an icon that follows the shell's color scheme");
	addSwitch(settings,group,'use-album','Use album art as icon when available',undefined);
	addSpinButton(settings,group,'album-size','Album art scaling (in %)',20,250,undefined);

	group = addGroup(page,'Position');
	let [extensionPlaceDropDown] = addDropDown(settings,group,'extension-place','Extension place',{'left':'left','center':'center','right':'right'},undefined);
	addSpinButton(settings,group,'extension-index','Extension index',0,20,"Set widget location within with respect to other adjacent widgets");
	addSpinButton(settings,group,'left-padding','Left padding',0,500,undefined);
	addSpinButton(settings,group,'right-padding','Right padding',0,500,undefined);

	group = addGroup(page,'Wrong index at loadup mitigations');
	addSpinButton(settings,group,'reposition-delay','Panel reposition at startup (delay in seconds)',0,300,"Increase this value if extension index isn't respected at startup");
	addSwitch(settings,group,'reposition-on-button-press','Update panel position on every button press',undefined);

	addResetButton(settings,group,'Reset Panel settings',[
		'show-icon','left-padding','right-padding','extension-index','extension-place','reposition-delay','reposition-on-button-press','use-album',
		'album-size','symbolic-source-icon','icon-padding'],
		[showIconDropDown,extensionPlaceDropDown]
	);

//label page:
	page = addPreferencesPage(window,'Label','document-edit-symbolic');

	group = addGroup(page,'Behaviour');
	addSwitch(settings,group,'auto-switch-to-most-recent','Switch to the most recent source automatically',"This option can be annoying without the use of filter lists");
	addSwitch(settings,group,'remove-text-when-paused','Hide when paused',undefined);
	addSpinButton(settings,group,'remove-text-paused-delay','Hide when paused delay (seconds)',0,9999,undefined);
	addSpinButton(settings,group,'refresh-rate','Refresh rate (milliseconds)',30,3000,undefined);
	addEntry(settings,group,'label-filtered-list','Filter segments containing',"Separate entries with commas, special characters will be removed\n\nThe targeted segments are defined in code as:\n\t\A substring enclosed by parentheses, square brackets,\n\t or between the end of the string and a hyphen");

	group = addGroup(page,'Appearance');
	addSpinButton(settings,group,'max-string-length','Max string length (each field)',1,150,undefined);
	addColorPicker(settings, group, 'font-color', 'Label Font color', "Default falls back to color defined by user theme");
	addEntry(settings,group,'button-placeholder','Button placeholder',"The button placeholder is a hint for the user and can be left empty.\n\nIt appears when the label is empty and another available source is active");
	addEntry(settings,group,'divider-string','Divider string (you can use spaces)',undefined);

	let fieldOptions1 = {'artist':'xesam:artist','album':'xesam:album','title':'xesam:title'};
	let fieldOptions2 = {'artist':'xesam:artist','album':'xesam:album','title':'xesam:title','none':''};
	let fieldOptions3 = {'artist':'xesam:artist','album':'xesam:album','title':'xesam:title','none':''};
	let [firstFieldDropDown, secondFieldDropDown, lastFieldDropDown] = addTripleDropDown(settings,group,'first-field','second-field','last-field','Visible fields and order',fieldOptions1,fieldOptions2,fieldOptions3,undefined);

	addResetButton(settings,group,'Reset Label settings',[
		'max-string-length','refresh-rate','font-color','button-placeholder','label-filtered-list','divider-string','first-field','second-field',
		'last-field','remove-text-when-paused','remove-text-paused-delay','auto-switch-to-most-recent'],[firstFieldDropDown, secondFieldDropDown, lastFieldDropDown]
	);

//filters page:
	page = addPreferencesPage(window,'Filters','dialog-error-symbolic');

	group = addGroup(page,'List of available MPRIS Sources');
	let sourcesListEntry = addWideEntry(settings,group,undefined,'',"Press the button below to update");
	sourcesListEntry.set_text(playersToString());
	sourcesListEntry.set_editable(false);

	let updateButton = addButton(group,'Update list of available MPRIS sources', () => {
		sourcesListEntry.set_text(playersToString());
	});
	updateButton.set_margin_top(10);

	group = addGroup(page,'Filters for MPRIS sources');
	addEntry(settings,group,'mpris-sources-blacklist','Ignore list','Separate entries with commas');
	addEntry(settings,group,'mpris-sources-whitelist','Allow list','Separate entries with commas');
	addSwitch(settings,group,'use-whitelisted-sources-only','Ignore all sources except allowed ones',"This option is ignored if the allow list is empty");
	addEntry(settings,group,'album-blacklist','Players excluded from using album art','Separate entries with commas');

	addResetButton(settings,group,'Reset Filters settings',[
		'mpris-sources-blacklist','mpris-sources-whitelist','use-whitelisted-sources-only','album-blacklist']
	);

//controls page:
	page = addPreferencesPage(window,'Controls','input-mouse-symbolic');

	let buttonActions = {
		'open menu':'open-menu','play/pause':'play-pause','next track':'next-track','previous track':'prev-track','next player':'next-player',
		'open app':'activate-player','volume mute':'volume-mute','volume up':'volume-up','volume down':'volume-down','none':'none'
	};

	group = addGroup(page,'Double Click');
	addSwitch(settings,group, 'enable-double-clicks', 'Enable double clicks', undefined);
	let doubleClickTime = addSpinButton(settings,group, 'double-click-time', 'Double click time (milliseconds)', 1, 1000, undefined);

	group = addGroup(page,'Mouse bindings');

	let row = new Adw.ActionRow({ title: ''});
	let singleClickLabel = new Gtk.Label({ //not sure how to underline or reduce height
		label: 'Single click',
		width_chars: 17
	});
	row.add_suffix(singleClickLabel);
	let doubleClickLabel = new Gtk.Label({
		label: 'Double click',
		width_chars: 17
	});
	row.add_suffix(doubleClickLabel);
	group.add(row);

	let [leftClickDropDown, leftDoubleClickDropDown] = addDoubleDropDown(settings,group,'left-click-action','left-double-click-action','Left click',buttonActions,buttonActions,undefined);
	let [middleClickDropDown, middleDoubleClickDropDown] = addDoubleDropDown(settings,group,'middle-click-action','middle-double-click-action','Middle click',buttonActions,buttonActions,undefined);
	let [rightClickDropDown, rightDoubleClickDropDown] = addDoubleDropDown(settings,group,'right-click-action','right-double-click-action','Right click',buttonActions,buttonActions,undefined);
	let [thumbForwardDropDown, thumbDoubleForwardDropDown] = addDoubleDropDown(settings,group,'thumb-forward-action','thumb-double-forward-action','Thumb-tip button',buttonActions,buttonActions,undefined);
	let [thumbBackwardDropDown, thumbDoubleBackwardDropDown] = addDoubleDropDown(settings,group,'thumb-backward-action','thumb-double-backward-action','Inner-thumb button',buttonActions,buttonActions,undefined);

	group = addGroup(page,'');
	let [scrollDropDown] = addDropDown(settings,group,'scroll-action','Scroll up/down',{'volume control':'volume-controls',"track change":"track-change" ,'none':'none'},undefined,140);
	let scrollSpin = addSpinButton(settings,group,'scroll-delay','Scroll Delay (milliseconds)',30,3000,'Defines the minimum time between consecutive track changes.\n\nIncrease the value if scrolls are found to generate multiple skips.\nDecrease value to allow faster consecutive skips.');
	
	let bindSensitive = () => { scrollSpin.set_sensitive((scrollDropDown.get_selected() == 1)); };
	scrollDropDown.connect('notify::selected-item', bindSensitive);
	bindSensitive();
	
	group = addGroup(page,'Behaviour');
	let [volumeControlDropDown] = addDropDown(settings,group,'volume-control-scheme','Volume control scheme',{'application':'application','global':'global'},undefined,140);

	addResetButton(settings,group,'Reset Controls settings',[
		'enable-double-clicks','double-click-time','left-click-action','left-double-click-action','middle-click-action','middle-double-click-action',
		'right-click-action','right-double-click-action','scroll-action','thumb-forward-action','thumb-double-forward-action','thumb-backward-action',
		'thumb-double-backward-action','scroll-delay','volume-control-scheme'],[leftClickDropDown, leftDoubleClickDropDown,middleClickDropDown, middleDoubleClickDropDown,
		rightClickDropDown, rightDoubleClickDropDown,thumbForwardDropDown, thumbDoubleForwardDropDown,thumbBackwardDropDown, thumbDoubleBackwardDropDown,
		scrollDropDown,volumeControlDropDown]
	);

	[doubleClickTime, doubleClickLabel, leftDoubleClickDropDown, middleDoubleClickDropDown, rightDoubleClickDropDown, thumbDoubleForwardDropDown, thumbDoubleBackwardDropDown]
		.forEach(el => bindEnabled(settings, 'enable-double-clicks', el));
}
}

// Adwaita "design" and "structure" functions

function addPreferencesPage(window,name,icon){
	let thisPage = new Adw.PreferencesPage({
		name: name,
		title: name,
		icon_name: icon,
	});
	window.add(thisPage);
	return thisPage;
}

function addGroup(page,title){
	let thisGroup = new Adw.PreferencesGroup({ title: title});
	page.add(thisGroup);
	return thisGroup;
}

// Adwaita 'Row' functions, they add a row to the target group with the widget(s) specified

function addSpinButton(settings,group,setting,labelstring,lower,upper,labeltooltip){
	let row = buildActionRow(labelstring,labeltooltip);

	let thisResetButton = buildResetButton(settings,setting);

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

	row.add_suffix(thisResetButton);
	row.add_suffix(thisSpinButton);

	thisSpinButton.connect('changed',() => {
		if (thisSpinButton.text == settings.get_default_value(setting).print(true))
			thisResetButton.set_visible(false)
		else
			thisResetButton.set_visible(true)
	})

	group.add(row);
	return row;
}

function addDropDownsList(settings,group, settingsList, labelstring, optionsList, labeltooltip,width){
	let row = buildActionRow(labelstring,labeltooltip);

	let thisDropDownList = [];//keep list of all dropDowns created (required for reset button generation/visibility)
	for (let i = 0; i < settingsList.length; i++)//generate dropdown for each setting
		thisDropDownList.push(buildDropDown(settings,settingsList[i],optionsList[i],width));

	//generate reset button (single button for all drop downs)
	let thisResetButton = buildDropDownResetButton(settings,settingsList,thisDropDownList,optionsList);
	row.add_suffix(thisResetButton);

	for (let i = 0; i < thisDropDownList.length; i++) {
		thisDropDownList[i].connect('notify::selected-item', () => {
			settings.set_string(settingsList[i],Object.values(optionsList[i])[thisDropDownList[i].get_selected()]);
			//set reset button visibility to true if any of the settings is different from default
			let setVisible = setDropDownResetVisibility(settings,settingsList,thisDropDownList,optionsList);
			thisResetButton.set_visible(setVisible);
		});
		row.add_suffix(thisDropDownList[i]);
	}

	group.add(row);
	return thisDropDownList;
}

function addDropDown(settings,group,setting,labelstring,options,labeltooltip,width=105){
	return addDropDownsList(settings,group, [setting], labelstring, [options], labeltooltip,width);
}

function addDoubleDropDown(settings,group,setting1,setting2,labelstring,options1,options2,labeltooltip,width=135){
	return addDropDownsList(settings,group, [setting1,setting2], labelstring, [options1,options2], labeltooltip,width);
}

function addTripleDropDown(settings,group,setting1,setting2,setting3,labelstring,options1,options2,options3,labeltooltip,width=81){
	return addDropDownsList(settings,group, [setting1,setting2,setting3], labelstring, [options1,options2,options3], labeltooltip,width);
}

function addSwitch(settings,group,setting,labelstring,labeltooltip){
	let row = buildActionRow(labelstring,labeltooltip);

	let thisResetButton = buildResetButton(settings,setting);
	row.add_suffix(thisResetButton);

	let thisSwitch = new Gtk.Switch({
		valign: Gtk.Align.CENTER,
		halign: Gtk.Align.END,
		visible: true
	});
	settings.bind(setting,thisSwitch,'active',Gio.SettingsBindFlags.DEFAULT);
	row.add_suffix(thisSwitch);

	thisSwitch.connect('notify::active',() => {
		if (thisSwitch.state == (settings.get_default_value(setting).print(true) === "true"))
			thisResetButton.set_visible(false);
		else
			thisResetButton.set_visible(true)
	})

	group.add(row)
}

function addEntry(settings,group,setting,labelstring,labeltooltip){
	let row = buildActionRow(labelstring,labeltooltip);

	let thisResetButton = buildResetButton(settings,setting);
	row.add_suffix(thisResetButton);

	let thisEntry = new Gtk.Entry({
		valign: Gtk.Align.CENTER,
		halign: Gtk.Align.END,
		width_request: 200,
		visible: true
	});
	settings.bind(setting,thisEntry,'text',Gio.SettingsBindFlags.DEFAULT);
	row.add_suffix(thisEntry);

	thisEntry.connect('changed',() => {
		if (thisEntry.text == settings.get_default_value(setting).print(true).replaceAll('\'', ''))
			thisResetButton.set_visible(false);
		else
			thisResetButton.set_visible(true)
	})

	group.add(row)
}

function addColorPicker(settings, group, setting, labelstring, labeltooltip) {
	let row = buildActionRow(labelstring, labeltooltip);

	let thisColorButton = new Gtk.ColorButton({
		valign: Gtk.Align.CENTER,
		halign: Gtk.Align.END,
		// #width_request: 200,
		visible: true
	});

	// bind/connect setting change to trigger update in button color
	settings.connect('changed::'+setting, () => {
		let rgba = new Gdk.RGBA();
		rgba.parse(settings.get_string(setting));
		thisColorButton.set_rgba(rgba);

		if (settings.get_string(setting) == settings.get_default_value(setting).print(true).replaceAll('\'', ''))
			thisResetButton.set_visible(false);
		else
			thisResetButton.set_visible(true);
	});

	let thisResetButton = buildColorResetButton(settings, setting, thisColorButton);
	row.add_suffix(thisResetButton);

	row.add_suffix(thisColorButton);

	// link items required to be able to reset using reset button
	thisColorButton._resetButton = thisResetButton;

	let rgba = new Gdk.RGBA();
	rgba.parse(settings.get_string(setting));
	thisColorButton.set_rgba(rgba);

	thisColorButton.connect('color-set', () => { //save selected colour as string
		let colorRGB = thisColorButton.get_rgba().to_string();
		settings.set_string(setting, colorRGB);
	})

	group.add(row)
}

function addWideEntry(settings,group,setting,placeholder,labeltooltip){
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

		thisEntry.connect('changed',() => {
			if (settings.get_string(setting)) //default for WideEntry is to be empty
				thisEntry.set_icon_from_icon_name(1,'edit-clear-symbolic');
			else
				thisEntry.set_icon_from_icon_name(1,'');
		})

		if (settings.get_string(setting))
			thisEntry.set_icon_from_icon_name(1,'edit-clear-symbolic');
	}

	thisEntry.set_placeholder_text(placeholder);
	group.add(thisEntry);

	return thisEntry;
}

function addResetButton(settings,group,labelstring,options,dropDowns){
	let thisButton = buildButton(labelstring, () => {
		options.forEach(option => {
			settings.reset(option);
		});
		if (dropDowns){
			dropDowns.forEach(dropDown => {
				dropDown.set_selected(dropDown._defaultValueIndex);
			});
		}
	});

	group.add(thisButton);

	return thisButton;
}

function addButton(group,labelstring,callback){
	let thisButton = buildButton(labelstring,callback);
	group.add(thisButton);
	return thisButton;
}

// 'build' functions, they build "generic" widgets of the specified type and returns it

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
		icon_name: 'dialog-information-symbolic',
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

function buildResetButton(settings,setting){
	let thisResetButton = new Gtk.Button({
		valign: Gtk.Align.CENTER,
		icon_name: 'edit-clear-symbolic-rtl',
		visible: false
	});

	//hide if matches default setting
	if (settings.get_value(setting).print(true) != settings.get_default_value(setting).print(true))
			thisResetButton.set_visible(true);

	thisResetButton.add_css_class('flat');
	thisResetButton.set_tooltip_text('Reset to Default');

	thisResetButton.connect('clicked',() => {settings.reset(setting)});

	return thisResetButton;
}

function buildColorResetButton(settings,setting) {
	let thisResetButton = new Gtk.Button({
		valign: Gtk.Align.CENTER,
		icon_name: 'edit-clear-symbolic-rtl',
		visible: false
	});

	//hide if matches default setting
	if (settings.get_value(setting).print(true) != settings.get_default_value(setting).print(true))
		thisResetButton.set_visible(true);

	thisResetButton.add_css_class('flat');
	thisResetButton.set_tooltip_text('Reset to Default');

	thisResetButton.connect('clicked', () => {settings.reset(setting);});

	return thisResetButton;
}

function buildDropDown(settings,setting,options,width){
	let thisDropDown = new Gtk.DropDown({
		model: Gtk.StringList.new(Object.keys(options)),
		selected: Object.values(options).indexOf(settings.get_string(setting)),
		valign: Gtk.Align.CENTER,
		halign: Gtk.Align.END
	});

	thisDropDown._defaultValueIndex = Object.values(options).indexOf(settings.get_default_value(setting).get_string()[0]);

	if (width)
		thisDropDown.set_size_request(width,-1);

	return thisDropDown;
}

function buildDropDownResetButton(settings,setting,dropDown,options){
	let thisResetButton = new Gtk.Button({
		valign: Gtk.Align.CENTER,
		icon_name: 'edit-clear-symbolic-rtl',
		visible: false
	});

	//hide if default setting
	setting.forEach((item) => {
		if (settings.get_value(item).print(true) != settings.get_default_value(item).print(true))
			thisResetButton.set_visible(true);
	})

	thisResetButton.add_css_class('flat');
	thisResetButton.set_tooltip_text('Reset to Default');

	thisResetButton.connect('clicked',() => {
		 for (let i = 0; i < setting.length; i++) {
			settings.reset(setting[i]);
			dropDown[i].set_selected(Object.values(options[i]).indexOf(settings.get_string(setting[i])));
		}
	});

	return thisResetButton;
}

function buildButton(labelstring,callback){
	let button = new Gtk.Button({
		label: labelstring,
		margin_top: 30,
		visible: true
	});
	button.connect('clicked',callback);

	return button;
}

// helper functions

function setDropDownResetVisibility(settings,settingsList,thisDropDownList,optionsList){ //show reset button if any of the values is different from default
	let setVisible = false;
	for (let i = 0; i < thisDropDownList.length; i++) {
		let thisDropDownValue = Object.values(optionsList[i])[thisDropDownList[i].get_selected()];
		if (thisDropDownValue != settings.get_default_value(settingsList[i]).print(true).replaceAll('\'', ''))
			setVisible = true;
	}
	return setVisible;
}

function bindEnabled(settings, setting, element) {
	settings.bind(setting, element, 'sensitive', Gio.SettingsBindFlags.GET);
}

// specific job/usage functions

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
		let entryProxy = entryWrapper(Gio.DBus.session,element,"/org/mpris/MediaPlayer2");
		let identity = entryProxy.Identity;
		newList.push(identity);
	});

	return newList.toString()
}

