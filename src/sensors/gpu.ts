import GLib from 'gi://GLib';

export class GPUSensor {
    private _gpuType: 'nvidia' | 'amd' | 'none' = 'none';
    private _errorCount: number = 0;
    private _maxErrors: number = 3;
    private _disabled: boolean = false;

    constructor() {
        this._detectGPU();
    }

    /**
     * Detect available GPU type using GLib.find_program_in_path
     * This prevents SpawnErrors because it doesn't execute a process.
     */
    private _detectGPU(): void {
        // Check for NVIDIA
        if (GLib.find_program_in_path('nvidia-smi')) {
            this._gpuType = 'nvidia';
            console.log('VitalsWidget: NVIDIA GPU detected');
            return;
        }
        
        // Check for AMD in common locations
        const amdPaths = ['radeontop', '/usr/sbin/radeontop', '/usr/local/bin/radeontop'];
        for (const path of amdPaths) {
            if (GLib.find_program_in_path(path)) {
                this._gpuType = 'amd';
                console.log(`VitalsWidget: AMD GPU detected (${path})`);
                return;
            }
        }
        
        console.log('VitalsWidget: No GPU monitoring tool detected (nvidia-smi or radeontop not found in PATH)');
        this._gpuType = 'none';
    }

    /**
     * Get current GPU utilization (0-100)
     */
    getValue(): number {
        // If disabled due to too many errors, don't try anymore
        if (this._disabled) {
            return 0;
        }

        // If no GPU was detected during init, don't even try to run commands
        if (this._gpuType === 'none') {
            return 0;
        }

        switch (this._gpuType) {
            case 'nvidia':
                return this._getNvidiaUsage();
            case 'amd':
                return this._getAMDUsage();
            default:
                return 0;
        }
    }

    private _getNvidiaUsage(): number {
        try {
            // Query first GPU (index 0) specifically
            const [success, stdout, stderr] = GLib.spawn_command_line_sync(
                'nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits -i 0'
            );

            if (!success) {
                this._handleError('NVIDIA command failed');
                return 0;
            }

            if (!stdout) {
                this._handleError('NVIDIA returned no output');
                return 0;
            }

            const output = new TextDecoder().decode(stdout).trim();
            
            if (output === '') {
                this._handleError('NVIDIA returned empty output');
                return 0;
            }

            const usage = parseInt(output);

            if (isNaN(usage)) {
                this._handleError(`NVIDIA returned invalid number: "${output}"`);
                return 0;
            }

            // Reset error count on success
            this._errorCount = 0;
            return Math.max(0, Math.min(100, usage));

        } catch (e) {
            this._handleError(`NVIDIA exception: ${e}`);
            return 0;
        }
    }

    private _getAMDUsage(): number {
        try {
            // radeontop args:
            // -d -  : dump data to stdout
            // -l 1  : limit to 1 sample (prevents infinite loop)
            // Note: radeontop typically requires root permissions
            const [success, stdout, stderr] = GLib.spawn_command_line_sync(
                'radeontop -d - -l 1'
            );

            if (!success) {
                // Check if stderr indicates permission issues
                if (stderr) {
                    const errorMsg = new TextDecoder().decode(stderr);
                    if (errorMsg.toLowerCase().includes('permission') || 
                        errorMsg.toLowerCase().includes('root')) {
                        this._handleError('AMD radeontop requires root/sudo permissions');
                    } else {
                        this._handleError(`AMD command failed: ${errorMsg.trim()}`);
                    }
                } else {
                    this._handleError('AMD command failed');
                }
                return 0;
            }

            if (!stdout) {
                this._handleError('AMD returned no output');
                return 0;
            }

            const output = new TextDecoder().decode(stdout);
            
            // Output format example: 
            // "1234567890.123: bus 03, gpu 14.17%, ee 0.00%, ..."
            const match = output.match(/gpu\s+(\d+(?:\.\d+)?)%/);

            if (match && match[1]) {
                const usage = parseFloat(match[1]);
                
                // Reset error count on success
                this._errorCount = 0;
                return Math.max(0, Math.min(100, usage));
            }

            this._handleError(`AMD output doesn't contain GPU usage: "${output.substring(0, 100)}"`);
            return 0;

        } catch (e) {
            this._handleError(`AMD exception: ${e}`);
            return 0;
        }
    }

    /**
     * Handle errors with automatic disable after too many failures
     */
    private _handleError(message: string): void {
        this._errorCount++;
        console.error(`VitalsWidget GPU Error (${this._errorCount}/${this._maxErrors}): ${message}`);
        
        if (this._errorCount >= this._maxErrors) {
            console.error(`VitalsWidget: GPU monitoring disabled after ${this._maxErrors} consecutive errors`);
            this._disabled = true;
        }
    }

    /**
     * Get diagnostic information about GPU detection
     */
    getDebugInfo(): string {
        const info = [
            `GPU Type: ${this._gpuType}`,
            `Disabled: ${this._disabled}`,
            `Error Count: ${this._errorCount}/${this._maxErrors}`
        ];
        
        if (this._gpuType === 'nvidia') {
            info.push('Tool: nvidia-smi');
        } else if (this._gpuType === 'amd') {
            info.push('Tool: radeontop (requires root)');
        }
        
        return info.join('\n');
    }

    /**
     * Re-enable GPU monitoring (useful if errors were temporary)
     */
    reset(): void {
        this._errorCount = 0;
        this._disabled = false;
        this._detectGPU();
        console.log('VitalsWidget: GPU sensor reset');
    }

    destroy(): void {
        this._gpuType = 'none';
        this._disabled = true;
    }
}