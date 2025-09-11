// utils/simulateApi.ts
export async function simulateApi<T>(fn: () => Promise<T>, delay = 800, failRate = 0.12): Promise<T> {
    await new Promise((r) => setTimeout(r, delay));
    if (Math.random() < failRate) throw new Error('Simulated API failure');
    return fn();
}
