'use strict';

const {Gio,Gtk} = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

const Config = imports.misc.config;
const [major] = Config.PACKAGE_VERSION.split('.');
const shellVersion = Number.parseInt(major);

function init() {
}

function buildPrefsWidget() {
    let settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.mpris-label');

    let prefsWidget;
    if (shellVersion < 40) {
        prefsWidget = new Gtk.Grid({
            margin: 18,
            column_spacing: 12,
            row_spacing: 12,
            visible: true,
            column_homogeneous: true,
        });
    } else {
        prefsWidget = new Gtk.Grid({
            margin_top: 10,
            margin_bottom: 10,
            margin_start: 10,
            margin_end: 10,
            column_spacing: 12,
            row_spacing: 12,
            visible: true,
            column_homogeneous: true,
        });
    }

    let title = new Gtk.Label({
        label: '<b> Mpris Label Extension Preferences</b>',
        halign: Gtk.Align.START,
        use_markup: true,
        visible: true
    });
    prefsWidget.attach(title, 0, 0, 1, 1);

    let labels = [
        'Left padding:','Right padding:','Max string length (each field):',
        'Extension index:','Extension place:','Refresh rate (milliseconds):',
        'Button place holder (can be left empty):','Remove remaster text:',
        'Divider String (you can use spaces):','Visible fields and order:',
        'Remove text when paused:',
	'Switch to the most recent source automatically:'
    ]

    labels.forEach(labelText =>{
        let thisLabel = new Gtk.Label({
            label: labelText,
            halign: Gtk.Align.START,
            visible: true
        });
        prefsWidget.attach(thisLabel, 0, labels.indexOf(labelText)+1, 1, 1);
    });

    let leftPaddingEntry = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
            lower: 0,
            upper: 500,
            step_increment: 1
        }),
        visible: true
    });
    prefsWidget.attach(leftPaddingEntry, 1, 1, 1, 1);

    let rightPaddingEntry = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
            lower: 0,
            upper: 500,
            step_increment: 1
        }),
        visible: true
    });
    prefsWidget.attach(rightPaddingEntry, 1, 2, 1, 1);

    let maxStringLengthEntry = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
            lower: 1,
            upper: 150,
            step_increment: 1
        }),
        visible: true
    });
    prefsWidget.attach(maxStringLengthEntry, 1, 3, 1, 1);

    let extensionIndexEntry = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
            lower: 0,
            upper: 20,
            step_increment: 1
        }),
        visible: true
    });
    prefsWidget.attach(extensionIndexEntry, 1, 4, 1, 1);

    let extensionPlaceComboBox = new Gtk.ComboBoxText({
        halign: Gtk.Align.END,
        visible: true
    });
    let options = ['left','center','right']
    options.forEach(element => {
        extensionPlaceComboBox.append(element,element);
    });
    extensionPlaceComboBox.set_active(options.indexOf(settings.get_string('extension-place')));
    extensionPlaceComboBox.connect('changed',comboBoxSetString.bind(this,'extension-place',extensionPlaceComboBox));

    function comboBoxSetString(settingKey,thisComboBox){ //this function is reused later
        settings.set_string(settingKey,thisComboBox.get_active_id());
    }

    prefsWidget.attach(extensionPlaceComboBox, 1, 5, 1, 1);

    let refreshRateEntry = new Gtk.SpinButton({
        adjustment: new Gtk.Adjustment({
            lower: 30,
            upper: 3000,
            step_increment: 1
        }),
        visible: true
    });
    prefsWidget.attach(refreshRateEntry, 1, 6, 1, 1);

    let buttonPlaceHolderEntry = new Gtk.Entry({
        visible: true
    });
    prefsWidget.attach(buttonPlaceHolderEntry, 1, 7, 1, 1);

    let removeRemasterTextSwitch = new Gtk.Switch({
    	valign: Gtk.Align.END,
    	halign: Gtk.Align.END,
    	visible: true
    });
    prefsWidget.attach(removeRemasterTextSwitch, 1, 8, 1, 1);

    let dividerStringEntry = new Gtk.Entry({
        visible: true
    });
    prefsWidget.attach(dividerStringEntry, 1, 9, 1, 1);

    let visibleFieldsBox = new Gtk.Box({
        spacing: 12,
        visible: true
    });

    let fieldOptions = {'artist':'xesam:artist','album':'xesam:album','title':'xesam:title'};

    let firstFieldComboBox = new Gtk.ComboBoxText({
        halign: Gtk.Align.END,
        visible: true,
    });

    for(let option in fieldOptions){
        firstFieldComboBox.append(fieldOptions[option],option);
    }

    firstFieldComboBox.set_active_id(settings.get_string('first-field'));
    firstFieldComboBox.connect('changed',comboBoxSetString.bind(this,'first-field',firstFieldComboBox));

    fieldOptions["none"] = "";

    let secondFieldComboBox = new Gtk.ComboBoxText({
        halign: Gtk.Align.END,
        visible: true,
    });

    for(let option in fieldOptions){
        secondFieldComboBox.append(fieldOptions[option],option);
    }

    secondFieldComboBox.set_active_id(settings.get_string('second-field'));
    secondFieldComboBox.connect('changed',comboBoxSetString.bind(this,'second-field',secondFieldComboBox));

    let lastFieldComboBox = new Gtk.ComboBoxText({
        halign: Gtk.Align.END,
        visible: true,
    });

    for(let option in fieldOptions){
        lastFieldComboBox.append(fieldOptions[option],option);
    }

    lastFieldComboBox.set_active_id(settings.get_string('last-field'));
    lastFieldComboBox.connect('changed',comboBoxSetString.bind(this,'last-field',lastFieldComboBox));

    if(shellVersion < 40){
        visibleFieldsBox.pack_start(firstFieldComboBox,true,true,0);
        visibleFieldsBox.pack_start(secondFieldComboBox,true,true,0);
        visibleFieldsBox.pack_start(lastFieldComboBox,true,true,0);
    }
    else{
        visibleFieldsBox.append(firstFieldComboBox,true,true,0);
        visibleFieldsBox.append(secondFieldComboBox,true,true,0);
        visibleFieldsBox.append(lastFieldComboBox,true,true,0);
    }

    prefsWidget.attach(visibleFieldsBox, 1, 10, 1, 1);
    
    let removePausedTextSwitch = new Gtk.Switch({
    	valign: Gtk.Align.END,
    	halign: Gtk.Align.END,
    	visible: true
    });
    prefsWidget.attach(removePausedTextSwitch, 1, 11, 1, 1);

    let autoSwitchToMostRecentSwitch = new Gtk.Switch({
        valign: Gtk.Align.END,
        halign: Gtk.Align.END,
        visible: true
    });
    prefsWidget.attach(autoSwitchToMostRecentSwitch, 1, 12, 1, 1);

    let resetButton = new Gtk.Button({
        label: 'Reset settings',
        visible: true
    });

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
        settings.reset('auto-switch-to-most-recent');
    });

    prefsWidget.attach(resetButton, 0, 13, 1, 1);

    settings.bind('left-padding',leftPaddingEntry,'value',Gio.SettingsBindFlags.DEFAULT);
    settings.bind('right-padding',rightPaddingEntry,'value',Gio.SettingsBindFlags.DEFAULT);
    settings.bind('max-string-length',maxStringLengthEntry,'value',Gio.SettingsBindFlags.DEFAULT);
    settings.bind('extension-index',extensionIndexEntry,'value',Gio.SettingsBindFlags.DEFAULT);
    settings.bind('refresh-rate',refreshRateEntry,'value',Gio.SettingsBindFlags.DEFAULT);
    settings.bind('button-placeholder',buttonPlaceHolderEntry,'text',Gio.SettingsBindFlags.DEFAULT);
    settings.bind('remove-remaster-text',removeRemasterTextSwitch,'active',Gio.SettingsBindFlags.DEFAULT);
    settings.bind('divider-string',dividerStringEntry,'text',Gio.SettingsBindFlags.DEFAULT);
    settings.bind('remove-text-when-paused',removePausedTextSwitch,'active',Gio.SettingsBindFlags.DEFAULT);
    settings.bind('auto-switch-to-most-recent',autoSwitchToMostRecentSwitch,'active',Gio.SettingsBindFlags.DEFAULT);

    return prefsWidget;
}
