import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib'
import { VitalType } from './config.js';
import { RingProgress } from './ring.js';
import { ICONS } from './icons.js';

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
    private _isDestroyed: boolean = false; // NEW: Track destruction state

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

    private _getGIcon(color: string): Gio.Icon {
        // Look up the SVG function by type (e.g., 'cpu', 'temp')
        const svgFunc = ICONS[this._type as keyof typeof ICONS];
        const svgString = svgFunc ? svgFunc(color) : '';
        
        // Convert string to Uint8Array before creating GLib.Bytes
        const encoder = new TextEncoder();
        const data = encoder.encode(svgString);
        const bytes = new GLib.Bytes(data);
        
        return Gio.BytesIcon.new(bytes);
    }

    private _buildUI(): void {
        if (this._isDestroyed) return;
        
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
        const diameter = this._settings.get_int('ring-diameter');
        const iconColor = this._settings.get_string('icon-color');
        return new St.Icon({
            gicon: this._getGIcon(iconColor),
            style_class: 'vital-icon',
            icon_size: Math.round(diameter * 0.5),
            style: 'stroke-width: 1px;',
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
            x_expand: true, y_expand: true,
        });
    }

    private _connectSettings(): void {
        if (this._isDestroyed) return;
        
        const keys = [
            'show-icons', 'show-labels', 'ring-diameter', 'vital-orientation'
        ];
        keys.forEach(key => {
            this._handlerIds.push(this._settings.connect(`changed::${key}`, () => {
                if (!this._isDestroyed) {
                    this._rebuildUI();
                }
            }));
        });

        const styleKeys = [`${this._type}-color`, 'icon-color', 'inactive-ring-color', 'label-font-size'];
        styleKeys.forEach(key => {
            this._handlerIds.push(this._settings.connect(`changed::${key}`, () => {
                if (!this._isDestroyed) {
                    this._updateStyle();
                }
            }));
        });
    }

    private _updateStyle(): void {
        // Check for existence AND parentage AND destruction state
        if (this._isDestroyed || !this._ringProgress || !this.get_parent()) return;
        
        const vitalColor = this._settings.get_string(`${this._type}-color`);
        const iconColor = this._settings.get_string('icon-color');
        
        if (this._icon) {
            this._icon.gicon = this._getGIcon(iconColor);
        }

        if (this._label) {
            this._label.set_style(`color: ${vitalColor}; font-size: ${this._settings.get_int('label-font-size')}px;`);
        }
    }

    private _rebuildUI(): void {
        if (this._isDestroyed || !this.get_parent()) return;
        
        // FIX: Destroy old ring progress explicitly before clearing children
        if (this._ringProgress) {
            this._ringProgress.destroy();
        }
        
        this.destroy_all_children();

        // Explicitly nullify references to destroyed children
        this._label = null;
        this._icon = null;
        this._ringProgress = null;

        this._buildUI();
        
        // Only update if we successfully rebuilt
        if (this._ringProgress) {
            this.update(this._currentValue);
        }
    }

    update(value: number): void {
        // FIX: Add destruction state check as first guard
        if (this._isDestroyed) return;
        
        // Strict safety check:
        // 1. Not destroyed
        // 2. RingProgress must exist
        // 3. Widget must be attached to the UI tree
        if (!this._ringProgress || !this.get_parent()) return;

        try {
            this._currentValue = Math.min(100, Math.max(0, value));
            
            // Safe to call methods now - ringProgress will check its own destruction state
            this._ringProgress.setValue(this._currentValue);
            
            if (this._label) {
                this._label.set_text(`${Math.round(this._currentValue)}%`);
            }
        } catch (e) {
            // If an object is disposed mid-function, catch it to prevent log spam
            if (!this._isDestroyed) {
                console.debug(`[VitalsWidget] Update suppressed: ${e}`);
            }
        }
    }

    destroy(): void {
        // FIX: Set destroyed flag FIRST to prevent callbacks from running
        this._isDestroyed = true;
        
        this._handlerIds.forEach(id => this._settings.disconnect(id));
        this._handlerIds = [];
        
        if (this._ringProgress) {
            this._ringProgress.destroy();
            this._ringProgress = null;
        }
        
        this._label = null;
        this._icon = null;
        
        super.destroy();
    }
});