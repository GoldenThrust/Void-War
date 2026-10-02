export function randomNum(min: number, max: number) {
    return (Math.random() * (max - min)) + min;
}

export function randomPick(arr: any[]) {
    return arr[Math.floor(randomNum(0, arr.length))]
}

export function randDiv(min: number, max: number, d: number) {
    const minK = Math.ceil(min / d);
    const maxK = Math.floor(max / d);

    const k = Math.floor(randomNum(minK, maxK + 1));
    return k * d;
}