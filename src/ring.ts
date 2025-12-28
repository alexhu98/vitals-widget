import St from 'gi://St';
import GObject from 'gi://GObject';
import Cairo from 'gi://cairo';
import { VitalType } from './config.js';

export const RingProgress = GObject.registerClass(
class RingProgress extends St.DrawingArea {
    private _type: VitalType;
    private _settings: any;
    private _value: number = 0;
    private _handlerIds: number[] = [];
    private _isDestroyed: boolean = false;

    constructor(type: VitalType, settings: any) {
        super({
            style_class: 'ring-progress',
        });

        this._type = type;
        this._settings = settings;

        this._updateSize();
        this._connectSettings();
    }

    //Update canvas dimensions based on diameter setting
    private _updateSize(): void {
        // Guard against destroyed state
        if (this._isDestroyed || !this._settings) return;

        const diameter = this._settings.get_int('ring-diameter');
        this.set_width(diameter);
        this.set_height(diameter);
    }

    //Connect to settings changes
    private _connectSettings(): void {
        if (this._isDestroyed || !this._settings) return;

        const signals = [
            `changed::${this._type}-color`,
            'changed::ring-diameter',
            'changed::ring-width'
        ];

        signals.forEach(signal => {
            const id = this._settings.connect(signal, () => {
                // Only queue repaint if not destroyed and still in UI tree
                if (!this._isDestroyed && this._settings && this.get_parent()) {
                    if (signal.includes('diameter')) this._updateSize();
                    this.queue_repaint();
                }
            });
            this._handlerIds.push(id);
        });
    }

    //Set progress value (0-100)
    setValue(value: number): void {
        // FIX: Check destruction state FIRST before any other operations
        if (this._isDestroyed) return;
        
        this._value = Math.min(100, Math.max(0, value));
        
        // Only repaint if the widget is currently in the UI tree
        if (this._settings && this.get_parent()) {
            this.queue_repaint();
        }
    }

    //Draw the circular progress ring
    vfunc_repaint(): void {
        // FIX: Core safety check including destruction state
        if (this._isDestroyed || !this._settings || !this.get_parent()) {
            return;
        }

        const cr = this.get_context();
        const [width, height] = this.get_surface_size();
        
        if (!cr || width === 0 || height === 0) {
            return;
        }

        try {
            const diameter = this._settings.get_int('ring-diameter');
            const ringWidth = this._settings.get_int('ring-width');
            const color = this._parseColor(this._settings.get_string(`${this._type}-color`));
            const inactiveColor = this._parseColor(this._settings.get_string('inactive-ring-color'));

            const centerX = width / 2;
            const centerY = height / 2;
            const radius = Math.max(0, (diameter / 2) - (ringWidth / 2) - 2);

            // Draw background circle (empty state)
            cr.setLineWidth(ringWidth);
            cr.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            cr.setSourceRGBA(inactiveColor.r, inactiveColor.g, inactiveColor.b, inactiveColor.a);
            cr.stroke();

            // Draw progress arc
            if (this._value > 0) {
                const startAngle = -Math.PI / 2; // Start at top (12 o'clock)
                const endAngle = startAngle + (2 * Math.PI * this._value) / 100;

                cr.setLineWidth(ringWidth);
                cr.setLineCap(Cairo.LineCap.ROUND); 
                cr.arc(centerX, centerY, radius, startAngle, endAngle);
                cr.setSourceRGBA(color.r, color.g, color.b, color.a);
                cr.stroke();
            }
        } catch (e) {
            if (!this._isDestroyed) {
                logError(e as Object, 'VitalsWidget: Error in RingProgress repaint');
            }
        }
    }

    //Parse color string to RGBA
    private _parseColor(colorStr: string): { r: number; g: number; b: number; a: number } {
        let r = 0.2, g = 0.6, b = 1.0, a = 1.0;

        if (!colorStr) return { r, g, b, a };

        if (colorStr.startsWith('#')) {
            const hex = colorStr.slice(1);
            if (hex.length === 6) {
                r = parseInt(hex.substring(0, 2), 16) / 255;
                g = parseInt(hex.substring(2, 4), 16) / 255;
                b = parseInt(hex.substring(4, 6), 16) / 255;
            } else if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16) / 255;
                g = parseInt(hex[1] + hex[1], 16) / 255;
                b = parseInt(hex[2] + hex[2], 16) / 255;
            }
        } else if (colorStr.startsWith('rgb')) {
            const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (match) {
                r = parseInt(match[1]) / 255;
                g = parseInt(match[2]) / 255;
                b = parseInt(match[3]) / 255;
                a = match[4] ? parseFloat(match[4]) : 1.0;
            }
        }

        return { r, g, b, a };
    }

    //Cleanup
    destroy(): void {
        this._isDestroyed = true;
        
        // Disconnect all signals to prevent callbacks firing after destruction
        if (this._settings) {
            this._handlerIds.forEach(id => this._settings.disconnect(id));
            this._handlerIds = [];
        }
        this._settings = null;
        super.destroy();
    }
});