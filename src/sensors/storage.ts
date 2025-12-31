import Gio from "gi://Gio";

export class StorageSensor {
  async getValue(): Promise<number> {
    try {
      // Async subprocess for df command
      const proc = Gio.Subprocess.new(
        ["df", "/"],
        Gio.SubprocessFlags.STDOUT_PIPE
      );
      const [stdout] = await proc.communicate_utf8_async(null, null);

      if (!stdout) return 0;
      const lines = stdout.split("\n");
      if (lines.length < 2) return 0;

      const columns = lines[1].split(/\s+/);
      const usageStr = columns.find((c) => c.includes("%"));
      return usageStr ? parseInt(usageStr) : 0;
    } catch (e) {
      return 0;
    }
  }
}
