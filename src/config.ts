
export enum VitalType {
    CPU = 'cpu',
    RAM = 'ram',
    STORAGE = 'storage',
    TEMP = 'temp',
    GPU = 'gpu',
}

// Bar orientation options
export enum Orientation {
    HORIZONTAL = 'horizontal',
    VERTICAL = 'vertical',
}



// Helper to get vital display name
export function getVitalDisplayName(type: VitalType): string {
    const names: Record<VitalType, string> = {
        [VitalType.CPU]: 'CPU',
        [VitalType.RAM]: 'RAM',
        [VitalType.STORAGE]: 'Storage',
        [VitalType.TEMP]: 'Temperature',
        [VitalType.GPU]: 'GPU',
    };
    return names[type];
}

