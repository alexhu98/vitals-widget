/**
 * VitalItem - Circular vital indicator with icon inside
 */

import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import { VitalType } from './config.js';
import { RingProgress } from './ring.js';

type RingProgressInstance = InstanceType<typeof RingProgress>;

export const VitalItem = GObject.registerClass(
class VitalItem extends St.BoxLayout {
    private _type: VitalType;
    private _settings: any;
    private _ringProgress: RingProgressInstance | null = null;
    private _icon: St.Icon | null = null;
    private _label: St.Label | null = null;
    private _handlerIds: number[] = [];
    private _currentValue: number = 0;

    constructor(type: VitalType, settings: any) {
        super({
            style_class: 'vital-item',
            vertical: true,
            x_align: Clutter.ActorAlign.CENTER,
        });

        this._type = type;
        this._settings = settings;

        this._buildUI();
        this._connectSettings();
        this._updateStyle();
    }

    private _buildUI(): void {
        this.vertical = this._settings.get_string('vital-orientation') === 'vertical';
        const container = new St.Widget({
            layout_manager: new Clutter.BinLayout(),
        });

        this._ringProgress = new RingProgress(this._type, this._settings) as RingProgressInstance;
        container.add_child(this._ringProgress);

        if (this._settings.get_boolean('show-icons')) {
            this._icon = this._createIcon();
            container.add_child(this._icon);
        }

        this.add_child(container);

        if (this._settings.get_boolean('show-labels')) {
            this._label = new St.Label({
                text: '0%',
                style_class: 'vital-label',
                x_align: Clutter.ActorAlign.CENTER,
            });
            this.add_child(this._label);
        }
    }

    private _createIcon(): St.Icon {
        const extension = this._settings.get_string('extension-path');
        const iconMap: Record<string, string> = { cpu: 'cpu.svg', ram: 'ram.svg', storage: 'storage.svg', temp: 'temp.svg', gpu: 'gpu.svg' };
        const gicon = Gio.icon_new_for_string(`${extension}/svg/${iconMap[this._type]}`);
        const diameter = this._settings.get_int('ring-diameter');
        
        return new St.Icon({
            gicon,
            style_class: 'vital-icon',
            icon_size: Math.round(diameter * 0.5),
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
            x_expand: true, y_expand: true,
        });
    }

    private _connectSettings(): void {
        const keys = [
            'show-icons', 'show-labels', 'ring-diameter', 'vital-orientation'
        ];
        keys.forEach(key => {
            this._handlerIds.push(this._settings.connect(`changed::${key}`, () => this._rebuildUI()));
        });

        const styleKeys = [`${this._type}-color`, 'icon-color', 'inactive-ring-color', 'label-font-size'];
        styleKeys.forEach(key => {
            this._handlerIds.push(this._settings.connect(`changed::${key}`, () => this._updateStyle()));
        });
    }

    private _updateStyle(): void {
        if (!this._label || !this._ringProgress) return;
        
        const vitalColor = this._settings.get_string(`${this._type}-color`);
        if (this._icon) this._icon.set_style(`color: ${this._settings.get_string('icon-color')};`);
        if (this._label) {
            this._label.set_style(`color: ${vitalColor}; font-size: ${this._settings.get_int('label-font-size')}px;`);
        }
    }

    private _rebuildUI(): void {
        if (!this.get_parent()) return;
        this.destroy_all_children();
        this._buildUI();
        this.update(this._currentValue);
    }

    update(value: number): void {
        // ULTIMATE GUARD: check if C-objects are still alive
        if (!this._label || !this._ringProgress || !this.get_parent()) return;

        try {
            this._currentValue = Math.min(100, Math.max(0, value));
            this._ringProgress.setValue(this._currentValue);
            this._label.set_text(`${Math.round(this._currentValue)}%`);
        } catch (e) {
            // Silently fail if object was disposed between the check and the call
        }
    }

    destroy(): void {
        this._handlerIds.forEach(id => this._settings.disconnect(id));
        this._handlerIds = [];
        
        if (this._ringProgress) this._ringProgress.destroy();
        this._ringProgress = null;
        this._label = null;
        this._icon = null;
        
        super.destroy();
    }
});