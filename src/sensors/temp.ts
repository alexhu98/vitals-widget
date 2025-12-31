import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

export class TempSensor {
    private _thermalPaths: string[] = [];
    private readonly MIN_TEMP = 30; // 30°C = 0%
    private readonly MAX_TEMP = 90; // 90°C = 100%

    constructor() {
        this._findThermalZones();
    }

    private async _findThermalZones(): Promise<void> {
        const basePath = '/sys/class/thermal';
        this._thermalPaths = [];
        
        try {
            const dir = Gio.File.new_for_path(basePath);
            
            // Check if directory exists
            if (!dir.query_exists(null)) {
                console.warn('TempSensor: Thermal directory not found');
                return;
            }

            // Enumerate children asynchronously
            const enumerator = await new Promise<Gio.FileEnumerator>((resolve, reject) => {
                dir.enumerate_children_async(
                    'standard::name',
                    Gio.FileQueryInfoFlags.NONE,
                    GLib.PRIORITY_LOW,
                    null,
                    (obj, res) => {
                        try {
                            resolve(dir.enumerate_children_finish(res));
                        } catch (e) {
                            reject(e);
                        }
                    }
                );
            });

            while (true) {
                // Get next file asynchronously
                const files = await new Promise<Gio.FileInfo[]>((resolve, reject) => {
                    enumerator.next_files_async(1, GLib.PRIORITY_LOW, null, (obj, res) => {
                        try {
                            resolve(enumerator.next_files_finish(res));
                        } catch (e) {
                            reject(e);
                        }
                    });
                });

                if (files.length === 0) break;

                const fileInfo = files[0];
                const name = fileInfo.get_name();
                
                if (name.startsWith('thermal_zone')) {
                    const typePath = `${basePath}/${name}/type`;
                    const tempPath = `${basePath}/${name}/temp`;
                    
                    try {
                        const typeFile = Gio.File.new_for_path(typePath);
                        const [contents] = await typeFile.load_contents_async(null);
                        
                        if (contents) {
                            const type = new TextDecoder().decode(contents as unknown as Uint8Array).trim().toLowerCase();
                            
                            // Look for CPU/AMD/Core related zones
                            if (type.includes('cpu') || 
                                type.includes('processor') || 
                                type.includes('x86_pkg_temp') ||
                                type.includes('k10temp') ||
                                type.includes('tctl') ||
                                type.includes('tdie') ||
                                type.includes('core')) {
                                this._thermalPaths.push(tempPath);
                            }
                        }
                    } catch (e) {
                        // Skip zone on error
                    }
                }
            }

            enumerator.close_async(GLib.PRIORITY_LOW, null, null);
        } catch (e) {
            console.warn(`TempSensor error finding zones: ${e}`);
        }

        // Fallback to common paths if none found via enumeration
        if (this._thermalPaths.length === 0) {
            const commonPaths = [
                '/sys/class/thermal/thermal_zone0/temp',
                '/sys/class/hwmon/hwmon0/temp1_input',
                '/sys/class/hwmon/hwmon1/temp1_input',
                '/sys/class/hwmon/hwmon2/temp1_input',
                '/sys/class/hwmon/hwmon0/device/temp1_input'
            ];
            
            for (const path of commonPaths) {
                if (Gio.File.new_for_path(path).query_exists(null)) {
                    this._thermalPaths.push(path);
                }
            }
        }
        
        console.log(`TempSensor: Found ${this._thermalPaths.length} thermal zones: ${this._thermalPaths.join(', ')}`);
    }

    //Get current temperature as percentage (0-100) asynchronously
    async getValue(): Promise<number> {
        let totalTemp = 0;
        let count = 0;

        // Iterate through paths using async loading
        const readPromises = this._thermalPaths.map(async (path) => {
            try {
                const file = Gio.File.new_for_path(path);
                const [contents] = await file.load_contents_async(null);
                
                if (contents) {
                    const data = new TextDecoder().decode(contents as unknown as Uint8Array).trim();
                    const tempMillidegrees = parseInt(data);

                    if (!isNaN(tempMillidegrees)) {
                        const tempCelsius = tempMillidegrees / 1000;
                        
                        // Sanity check: 5°C to 150°C
                        if (tempCelsius > 5 && tempCelsius < 150) {
                            return tempCelsius;
                        }
                    }
                }
            } catch (e) {
                // Ignore errors for individual files
            }
            return null;
        });

        const results = await Promise.all(readPromises);

        for (const temp of results) {
            if (temp !== null) {
                totalTemp += temp;
                count++;
            }
        }

        if (count === 0) return 0;

        const avgTemp = totalTemp / count;

        // Map average temperature to 0-100 scale
        const percentage = ((avgTemp - this.MIN_TEMP) / (this.MAX_TEMP - this.MIN_TEMP)) * 100;
        return Math.max(0, Math.min(100, percentage));
    }

}