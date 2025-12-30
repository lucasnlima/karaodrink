const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function frequencyToNote(frequency) {
    if (!frequency || frequency <= 0) return "-";
    const halfStepsFromA4 = Math.round(12 * Math.log2(frequency / 440));
    const octave = 4 + Math.floor((9 + halfStepsFromA4) / 12);
    const noteIndex = (9 + halfStepsFromA4) % 12;
    const positiveIndex = (noteIndex < 0 ? noteIndex + 12 : noteIndex) % 12;
    return NOTES[positiveIndex] + octave;
}
