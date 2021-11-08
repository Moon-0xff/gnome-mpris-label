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
        'Left padding:','Right padding:','Max string length (Each field):',
        'Extension index:','Extension place:','Refresh rate (milliseconds):',
        'Button place holder (can be left empty):','Remove remaster text:',
        'Divider String (you can use spaces):'
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

    settings.bind('left-padding',leftPaddingEntry,'value',Gio.SettingsBindFlags.DEFAULT);
    settings.bind('right-padding',rightPaddingEntry,'value',Gio.SettingsBindFlags.DEFAULT);
    settings.bind('max-string-length',maxStringLengthEntry,'value',Gio.SettingsBindFlags.DEFAULT);
    settings.bind('extension-index',extensionIndexEntry,'value',Gio.SettingsBindFlags.DEFAULT);
    settings.bind('extension-place',extensionPlaceComboBox,'active',Gio.SettingsBindFlags.DEFAULT);
    settings.bind('refresh-rate',refreshRateEntry,'value',Gio.SettingsBindFlags.DEFAULT);
    settings.bind('button-placeholder',buttonPlaceHolderEntry,'text',Gio.SettingsBindFlags.DEFAULT);
    settings.bind('remove-remaster-text',removeRemasterTextSwitch,'active',Gio.SettingsBindFlags.DEFAULT);
    settings.bind('divider-string',dividerStringEntry,'text',Gio.SettingsBindFlags.DEFAULT);

    return prefsWidget;
}
