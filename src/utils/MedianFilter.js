// Median filter for pitch streams: removes YIN outliers (octave jumps,
// bass/harmonic flips) without lagging like a moving average.
export class MedianFilter {
    constructor(size = 5) {
        this.size = size;
        this.values = [];
    }

    // Returns the median of the recent window, or null on silence.
    // A null input resets the window so a gap doesn't bridge two phrases.
    push(value) {
        if (value === null || value === undefined || !isFinite(value)) {
            this.values = [];
            return null;
        }
        this.values.push(value);
        if (this.values.length > this.size) this.values.shift();
        const sorted = [...this.values].sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)];
    }

    reset() {
        this.values = [];
    }
}
