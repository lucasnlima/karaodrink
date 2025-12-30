import { DynamicWavelet } from 'pitchfinder';
import { YIN as CustomYIN } from '../utils/YIN';

export class AudioEngine {
    constructor() {
        this.ctx = null;
        this.analyserVoice = null;
        this.analyserMusic = null;
        this.bufferVoice = null;
        this.bufferMusic = null;

        // Default algorithms
        this._algorithmFactoryVoice = CustomYIN;
        this._algorithmFactoryMusic = CustomYIN;

        this.voiceThreshold = 0.10;
        this.musicThreshold = 0.10;

        this.detectorVoice = null;
        this.detectorMusic = null;

        // Filter Nodes
        this.filterMusicHigh = null;
        this.filterMusicLow = null;
        this.compressorMusic = null;

        this.isRunning = false;
        this.debug = false;
        this.frameCount = 0;
    }

    setDebug(enabled) {
        this.debug = enabled;
    }

    updateSettings(settings) {
        if (settings.voiceThreshold !== undefined) {
            this.voiceThreshold = settings.voiceThreshold;
            this._updateVoiceDetector();
        }
        if (settings.musicThreshold !== undefined) {
            this.musicThreshold = settings.musicThreshold;
            this._updateMusicDetector();
        }
        if (settings.voiceAlgorithm) {
            this.setVoiceAlgorithm(settings.voiceAlgorithm);
        }
        if (settings.musicAlgorithm) {
            this.setMusicAlgorithm(settings.musicAlgorithm);
        }
        if (settings.useMelodyFilter !== undefined) {
            this.setMusicFilter(settings.useMelodyFilter);
        }
    }

    setMusicFilter(enabled) {
        if (!this.filterMusicHigh || !this.filterMusicLow || !this.compressorMusic) return;

        if (enabled) {
            // Engage: Vocal Range focusing (approx 200Hz - 3000Hz)
            this.filterMusicLow.frequency.value = 3000; // Lowpass at 3kHz
            this.filterMusicHigh.frequency.value = 200; // Highpass at 200Hz
            this.compressorMusic.threshold.value = -30;
            this.compressorMusic.ratio.value = 12;
            console.log("Melody Filter: ON");
        } else {
            // Bypass mode
            this.filterMusicLow.frequency.value = 22000;
            this.filterMusicHigh.frequency.value = 10;
            this.compressorMusic.threshold.value = 0;
            this.compressorMusic.ratio.value = 1;
            console.log("Melody Filter: OFF");
        }
    }

    // --- Voice Logic ---
    setVoiceAlgorithm(name) {
        if (name === 'DW') this._algorithmFactoryVoice = DynamicWavelet;
        else if (name === 'CustomYIN') this._algorithmFactoryVoice = CustomYIN;
        this._updateVoiceDetector();
    }

    _updateVoiceDetector() {
        if (this.ctx) {
            this.detectorVoice = this._algorithmFactoryVoice({ sampleRate: this.ctx.sampleRate, threshold: this.voiceThreshold });
        }
    }

    getVoicePitch() {
        if (!this.analyserVoice) return null;
        this.analyserVoice.getFloatTimeDomainData(this.bufferVoice);

        const rms = this.getRMS(this.bufferVoice);
        if (rms < 0.02) return null;

        if (!this.detectorVoice) return null;
        const pitch = this.detectorVoice(this.bufferVoice);

        if (this.debug && this.frameCount % 30 === 0) {
            console.log(`[VOICE] RMS: ${rms.toFixed(5)} | Pitch: ${pitch}`);
        }

        if (pitch > 3000 || pitch < 40) return null;
        return pitch;
    }

    // --- Music Logic ---
    setMusicAlgorithm(name) {
        if (name === 'DW') this._algorithmFactoryMusic = DynamicWavelet;
        else if (name === 'CustomYIN') this._algorithmFactoryMusic = CustomYIN;
        this._updateMusicDetector();
    }

    _updateMusicDetector() {
        if (this.ctx) {
            this.detectorMusic = this._algorithmFactoryMusic({ sampleRate: this.ctx.sampleRate, threshold: this.musicThreshold });
        }
    }

    getMusicPitch() {
        if (!this.analyserMusic) return null;
        this.analyserMusic.getFloatTimeDomainData(this.bufferMusic);

        const rms = this.getRMS(this.bufferMusic);
        if (rms < 0.01) return null;

        if (!this.detectorMusic) return null;
        const pitch = this.detectorMusic(this.bufferMusic);

        if (this.debug && (this.frameCount++ % 30 === 0)) {
            console.log(`[MUSIC] RMS: ${rms.toFixed(5)} | Pitch: ${pitch}`);
        }

        return pitch;
    }

    async init() {
        if (this.ctx) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        await this.ctx.resume();

        this._updateVoiceDetector();
        this._updateMusicDetector();

        this.analyserVoice = this.ctx.createAnalyser();
        this.analyserVoice.fftSize = 4096;
        this.bufferVoice = new Float32Array(this.analyserVoice.fftSize);

        this.analyserMusic = this.ctx.createAnalyser();
        this.analyserMusic.fftSize = 4096;
        this.bufferMusic = new Float32Array(this.analyserMusic.fftSize);

        this.isRunning = true;
        console.log("AudioEngine initialized. SampleRate:", this.ctx.sampleRate);
    }

    async startMicrophone() {
        if (this._micStream && this._micStream.active) {
            console.log("AudioEngine: Microphone already active, skipping prompt.");
            if (this.ctx.state === 'suspended') await this.ctx.resume();
            return;
        }

        if (!this.ctx) await this.init();
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            this._micStream = stream;
            const source = this.ctx.createMediaStreamSource(stream);

            const filterLow = this.ctx.createBiquadFilter();
            filterLow.type = 'highpass';
            filterLow.frequency.value = 70;

            const filterHigh = this.ctx.createBiquadFilter();
            filterHigh.type = 'lowpass';
            filterHigh.frequency.value = 1500;

            source.connect(filterLow);
            filterLow.connect(filterHigh);
            filterHigh.connect(this.analyserVoice);

            console.log("Microphone connected");
        } catch (e) {
            console.error("Error accessing microphone:", e);
        }
    }

    async startSystemAudio() {
        if (this._tabStream && this._tabStream.active) {
            console.log("AudioEngine: Tab audio already active, skipping prompt.");
            if (this.ctx.state === 'suspended') await this.ctx.resume();
            return;
        }

        if (!this.ctx) await this.init();
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                },
                selfBrowserSurface: "include",
                preferCurrentTab: true
            });

            const audioTrack = stream.getAudioTracks()[0];
            if (!audioTrack) {
                console.error("No audio track in system stream");
                return;
            }

            this._tabStream = stream;
            const mediaStream = new MediaStream([audioTrack]);
            const source = this.ctx.createMediaStreamSource(mediaStream);

            this.filterMusicHigh = this.ctx.createBiquadFilter();
            this.filterMusicHigh.type = 'highpass';
            this.filterMusicHigh.frequency.value = 10;

            this.filterMusicLow = this.ctx.createBiquadFilter();
            this.filterMusicLow.type = 'lowpass';
            this.filterMusicLow.frequency.value = 22000;

            this.compressorMusic = this.ctx.createDynamicsCompressor();
            this.compressorMusic.threshold.value = 0;
            this.compressorMusic.ratio.value = 1;

            source.connect(this.filterMusicHigh);
            this.filterMusicHigh.connect(this.filterMusicLow);
            this.filterMusicLow.connect(this.compressorMusic);
            this.compressorMusic.connect(this.analyserMusic);

            console.log("System audio connected");
        } catch (e) {
            console.error("Error accessing system audio:", e);
        }
    }

    stopAllStreams() {
        if (this._micStream) {
            this._micStream.getTracks().forEach(t => t.stop());
            this._micStream = null;
        }
        if (this._tabStream) {
            this._tabStream.getTracks().forEach(t => t.stop());
            this._tabStream = null;
        }
        if (this.ctx) {
            this.ctx.close();
            this.ctx = null;
        }
        this.isRunning = false;
        console.log("AudioEngine: All streams and context fully stopped and released.");
    }

    getRMS(buffer) {
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i] * buffer[i];
        }
        return Math.sqrt(sum / buffer.length);
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    stop() {
        if (this.ctx) {
            this.ctx.close();
            this.ctx = null;
            this.isRunning = false;
        }
    }
}

export const audioEngine = new AudioEngine();
