import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

export class GPUSensor {
    private _gpuType: 'nvidia' | 'amd_sysfs' | 'amd_radeontop' | 'none' = 'none';
    private _sysfsPath: string = '';
    private _errorCount: number = 0;
    private _maxErrors: number = 5;
    private _disabled: boolean = false;

    constructor() {
        this._detectGPU();
    }

    private _detectGPU(): void {
        const nvidiaSmiPath = GLib.find_program_in_path('nvidia-smi');
        if (nvidiaSmiPath) {
            this._gpuType = 'nvidia';
            return;
        }

        for (let i = 0; i < 10; i++) {
            const path = `/sys/class/drm/card${i}/device/gpu_busy_percent`;
            if (Gio.File.new_for_path(path).query_exists(null)) {
                this._gpuType = 'amd_sysfs';
                this._sysfsPath = path;
                return;
            }
        }
        
        if (GLib.find_program_in_path('radeontop')) {
            this._gpuType = 'amd_radeontop';
            return;
        }
        this._gpuType = 'none';
    }

    async getValue(): Promise<number> {
        if (this._disabled || this._gpuType === 'none') return 0;

        switch (this._gpuType) {
            case 'nvidia': return await this._getNvidiaUsage();
            case 'amd_sysfs': return await this._getAmdSysfsUsage();
            case 'amd_radeontop': return await this._getAmdRadeontopUsage();
            default: return 0;
        }
    }

    private async _getNvidiaUsage(): Promise<number> {
        try {
            const proc = Gio.Subprocess.new(
                ['nvidia-smi', '--query-gpu=utilization.gpu', '--format=csv,noheader,nounits'],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );
            const [stdout] = await proc.communicate_utf8_async(null, null);
            
            const usage = parseInt(stdout?.trim() || '0');
            this._errorCount = 0;
            return isNaN(usage) ? 0 : Math.max(0, Math.min(100, usage));
        } catch (e) {
            this._handleError(e);
            return 0;
        }
    }

    private async _getAmdSysfsUsage(): Promise<number> {
        try {
            const file = Gio.File.new_for_path(this._sysfsPath);
            const [contents] = await file.load_contents_async(null);
            if (!contents) return 0;
            
            const data = new TextDecoder().decode(contents as unknown as Uint8Array);
            const usage = parseInt(data.trim());
            
            this._errorCount = 0;
            return isNaN(usage) ? 0 : Math.max(0, Math.min(100, usage));
        } catch (e) {
            this._handleError(e);
            return 0;
        }
    }

    private async _getAmdRadeontopUsage(): Promise<number> {
        try {
            const proc = Gio.Subprocess.new(
                ['radeontop', '-d', '-', '-l', '1'],
                Gio.SubprocessFlags.STDOUT_PIPE
            );
            const [stdout] = await proc.communicate_utf8_async(null, null);
            const match = stdout?.match(/gpu\s+(\d+(?:\.\d+)?)%/);
            return match ? Math.round(parseFloat(match[1])) : 0;
        } catch (e) {
            return 0;
        }
    }

    private _handleError(e: any): void {
        this._errorCount++;
        if (this._errorCount >= this._maxErrors) this._disabled = true;
    }
}