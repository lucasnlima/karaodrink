// src/utils/YIN.js
export function YIN(options) {
    options = options || {};
    var sampleRate = options.sampleRate || 44100;
    var threshold = typeof options.threshold === "number" ? options.threshold : 0.15;

    return function (buffer) {
        if (!buffer || buffer.length === 0) return null;
        var yinBuffer = new Float32Array(buffer.length / 2);
        var tau;
        var yinBufferSize = yinBuffer.length;

        // 1. difference function
        for (var t = 0; t < yinBufferSize; t++) {
            var sum = 0;
            for (var i = 0; i < yinBufferSize; i++) {
                var delta = buffer[i] - buffer[i + t];
                sum += delta * delta;
            }
            yinBuffer[t] = sum;
        }

        // 2. cumulative mean normalized difference
        var runningSum = 0;
        yinBuffer[0] = 1;
        for (var t = 1; t < yinBufferSize; t++) {
            runningSum += yinBuffer[t];
            yinBuffer[t] = (yinBuffer[t] * t) / runningSum;
        }

        // 3. absolute threshold
        tau = -1;
        for (var t = 2; t < yinBufferSize; t++) {
            if (yinBuffer[t] < threshold) {
                while (t + 1 < yinBufferSize && yinBuffer[t + 1] < yinBuffer[t]) t++;
                tau = t;
                break;
            }
        }

        if (tau === -1) return null;

        // 4. parabolic interpolation
        var x0 = tau - 1 < 0 ? tau : tau - 1;
        var x2 = tau + 1 < yinBufferSize ? tau + 1 : tau;
        if (x0 === tau || x2 === tau) return sampleRate / tau;
        var s0 = yinBuffer[x0];
        var s1 = yinBuffer[tau];
        var s2 = yinBuffer[x2];
        var betterTau = tau + (s2 - s0) / (2 * (2 * s1 - s2 - s0));

        if (!isFinite(betterTau) || betterTau <= 0) betterTau = tau;

        return sampleRate / betterTau;
    };
}
