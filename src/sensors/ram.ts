import Gio from 'gi://Gio';

export class RAMSensor {
    async getValue(): Promise<number> {
        try {
            const file = Gio.File.new_for_path('/proc/meminfo');
            const [contents] = await file.load_contents_async(null);
            
            if (!contents) return 0;

            // Decode Uint8Array to string
            const data = new TextDecoder().decode(contents as any);
            const lines = data.split('\n');
            let memTotal = 0, memAvailable = 0;

            for (const line of lines) {
                if (line.startsWith('MemTotal:')) memTotal = this._parseMemValue(line);
                else if (line.startsWith('MemAvailable:')) memAvailable = this._parseMemValue(line);
                if (memTotal > 0 && memAvailable > 0) break;
            }

            return memTotal === 0 ? 0 : Math.max(0, Math.min(100, ((memTotal - memAvailable) / memTotal) * 100));
        } catch (e) {
            return 0;
        }
    }

    private _parseMemValue(line: string): number {
        const match = line.match(/:\s*(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }
}