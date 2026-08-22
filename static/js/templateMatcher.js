/**
 * =====================================================================
 * TEMPLATE-BASED MANTRA MATCHER (DTW / acoustic-fingerprint mode)
 * =====================================================================
 * Alternative to Web Speech API transcription: instead of asking the
 * browser "what words were said," this directly compares the SHAPE of
 * live audio against pre-recorded reference clips of the mantra.
 *
 * !! IMPORTANT ACCURACY CAVEAT !!
 * The bundled templates.json was built from a SLOW, deliberate reference
 * recording (~5.1s per repetition). The user has confirmed real chanting
 * is FAST/continuous (~1.5-3s per repetition). DTW can absorb some pace
 * variation, but not usually a ~2x speed difference. Expect this to
 * UNDER-MATCH real fast chanting until templates.json is rebuilt from a
 * fast-paced reference recording (same Python pipeline, new source WAV).
 * Swapping in a new templates.json requires no code changes here.
 * =====================================================================
 */

class MantraTemplateMatcher {
    constructor(templatesUrl = '/static/templates.json') {
        this.templatesUrl = templatesUrl;
        this.templates = [];       // array of Float32Array[frames][nMels], normalized
        this.melFilterbank = null; // Float32Array[nMels][nFftBins]
        this.meta = null;

        this.sampleRate = 16000;
        this.nFft = 512;
        this.hop = 160;            // 10ms @ 16kHz
        this.nMels = 26;

        this.audioContext = null;
        this.sourceNode = null;
        this.processorNode = null;
        this.mediaStream = null;

        this.pcmRingBuffer = new Float32Array(this.nFft * 4); // small rolling buffer
        this.ringWritePos = 0;
        this.samplesSinceLastFrame = 0;

        // Rolling feature buffer: holds enough frames to cover the longest template + margin
        this.featureBuffer = [];
        this.maxFeatureBufferFrames = 800; // ~8s at 10ms hop, generous margin

        // Matching state
        this.isRunning = false;
        this.matchThreshold = 2.4;      // tune once real-pace templates are in place
        this.minFramesBetweenMatches = 150; // debounce: ~1.5s min gap between counted reps
        this.framesSinceLastMatch = 999;
        this.matchCheckIntervalFrames = 15; // check for a match every ~150ms of audio

        this.onMatch = null;   // callback(distance) set by caller
        this.onFrame = null;   // optional callback(frameCount) for UI/debug
    }

    async loadTemplates() {
        const res = await fetch(this.templatesUrl);
        if (!res.ok) throw new Error('Failed to load templates.json: HTTP ' + res.status);
        const data = await res.json();

        this.meta = data.meta;
        this.sampleRate = data.meta.sampleRate;
        this.nFft = data.meta.nFft;
        this.hop = data.meta.hopSize;
        this.nMels = data.meta.nMels;

        this.melFilterbank = data.melFilterbank.map(row => Float32Array.from(row));
        this.templates = data.templates.map(t => t.map(frame => Float32Array.from(frame)));

        console.log('✅ Loaded ' + this.templates.length + ' templates. Phrase: "' + data.meta.phrase + '"');
        if (data.meta.paceWarning) {
            console.warn('⚠️ TEMPLATE PACE WARNING: ' + data.meta.paceWarning);
        }

        return data.meta;
    }

    async start() {
        if (this.templates.length === 0) {
            await this.loadTemplates();
        }

        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Request an AudioContext at the SAME sample rate the templates were built at.
        // Browsers will resample internally if the hardware differs.
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: this.sampleRate
        });

        this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

        // ScriptProcessorNode is deprecated but has the broadest compatibility
        // for this kind of raw-PCM-access use case. bufferSize chosen so each
        // callback delivers a manageable chunk; we still re-frame internally
        // at exact hop boundaries regardless of callback buffer size.
        const bufferSize = 2048;
        this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

        this.processorNode.onaudioprocess = (e) => {
            const input = e.inputBuffer.getChannelData(0);
            this._ingestPCM(input);
        };

        this.sourceNode.connect(this.processorNode);
        // Must connect to destination for onaudioprocess to fire in most browsers;
        // route through a zero-gain node so nothing is actually played back.
        const silentGain = this.audioContext.createGain();
        silentGain.gain.value = 0;
        this.processorNode.connect(silentGain);
        silentGain.connect(this.audioContext.destination);

        this.isRunning = true;
        console.log('🎤 Template matcher started (sampleRate=' + this.audioContext.sampleRate + ')');
    }

    stop() {
        this.isRunning = false;
        if (this.processorNode) { this.processorNode.disconnect(); this.processorNode = null; }
        if (this.sourceNode) { this.sourceNode.disconnect(); this.sourceNode = null; }
        if (this.mediaStream) { this.mediaStream.getTracks().forEach(t => t.stop()); this.mediaStream = null; }
        if (this.audioContext) { this.audioContext.close(); this.audioContext = null; }
        console.log('⏸️ Template matcher stopped');
    }

    // ----------------------------------------------------------------
    // PCM ingestion: accumulate samples, cut exact nFft-length frames
    // every hop samples (matches the Python extraction exactly).
    // ----------------------------------------------------------------
    _ingestPCM(chunk) {
        if (!this._pcmAccum) this._pcmAccum = new Float32Array(0);

        const combined = new Float32Array(this._pcmAccum.length + chunk.length);
        combined.set(this._pcmAccum, 0);
        combined.set(chunk, this._pcmAccum.length);

        let offset = 0;
        while (offset + this.nFft <= combined.length) {
            const frame = combined.subarray(offset, offset + this.nFft);
            this._processFrame(frame);
            offset += this.hop;
        }
        this._pcmAccum = combined.subarray(offset);
    }

    _processFrame(frame) {
        const windowed = this._applyHanning(frame);
        const spectrum = this._fftPowerSpectrum(windowed);
        const melEnergy = this._applyMelFilterbank(spectrum);
        const logMel = melEnergy.map(v => Math.log(v + 1e-8));

        this.featureBuffer.push(logMel);
        if (this.featureBuffer.length > this.maxFeatureBufferFrames) {
            this.featureBuffer.shift();
        }

        this.framesSinceLastMatch++;
        if (this.onFrame) this.onFrame(this.featureBuffer.length);

        if (this.featureBuffer.length % this.matchCheckIntervalFrames === 0) {
            this._tryMatch();
        }
    }

    _applyHanning(frame) {
        const n = frame.length;
        const out = new Float32Array(n);
        for (let i = 0; i < n; i++) {
            const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
            out[i] = frame[i] * w;
        }
        return out;
    }

    // Simple radix-2 FFT (in-place, iterative). nFft must be a power of 2.
    _fftPowerSpectrum(real) {
        const n = real.length;
        const re = Float32Array.from(real);
        const im = new Float32Array(n);

        // bit-reversal permutation
        for (let i = 1, j = 0; i < n; i++) {
            let bit = n >> 1;
            for (; j & bit; bit >>= 1) j ^= bit;
            j ^= bit;
            if (i < j) {
                [re[i], re[j]] = [re[j], re[i]];
                [im[i], im[j]] = [im[j], im[i]];
            }
        }

        for (let len = 2; len <= n; len <<= 1) {
            const ang = (-2 * Math.PI) / len;
            const wr = Math.cos(ang), wi = Math.sin(ang);
            for (let i = 0; i < n; i += len) {
                let curWr = 1, curWi = 0;
                for (let j = 0; j < len / 2; j++) {
                    const ur = re[i + j], ui = im[i + j];
                    const vr = re[i + j + len / 2] * curWr - im[i + j + len / 2] * curWi;
                    const vi = re[i + j + len / 2] * curWi + im[i + j + len / 2] * curWr;
                    re[i + j] = ur + vr; im[i + j] = ui + vi;
                    re[i + j + len / 2] = ur - vr; im[i + j + len / 2] = ui - vi;
                    const nWr = curWr * wr - curWi * wi;
                    const nWi = curWr * wi + curWi * wr;
                    curWr = nWr; curWi = nWi;
                }
            }
        }

        // power spectrum, positive frequencies only (n/2 + 1 bins, matching np.fft.rfft)
        const nBins = n / 2 + 1;
        const power = new Float32Array(nBins);
        for (let k = 0; k < nBins; k++) {
            power[k] = re[k] * re[k] + im[k] * im[k];
        }
        return power;
    }

    _applyMelFilterbank(powerSpectrum) {
        const out = new Float32Array(this.nMels);
        for (let m = 0; m < this.nMels; m++) {
            let sum = 0;
            const row = this.melFilterbank[m];
            for (let k = 0; k < row.length; k++) {
                sum += row[k] * powerSpectrum[k];
            }
            out[m] = sum;
        }
        return out;
    }

    // ----------------------------------------------------------------
    // MATCHING: for each template, take the most recent N frames of the
    // live buffer (N = that template's length), z-score normalize, and
    // compute banded DTW distance. Report the best (lowest) match.
    // ----------------------------------------------------------------
    _tryMatch() {
        if (this.framesSinceLastMatch < this.minFramesBetweenMatches) return;

        let bestDist = Infinity;
        let bestTemplateIdx = -1;

        for (let t = 0; t < this.templates.length; t++) {
            const template = this.templates[t];
            const T = template.length;
            if (this.featureBuffer.length < T) continue;

            const window = this.featureBuffer.slice(this.featureBuffer.length - T);
            const windowNorm = this._zScoreNormalize(window);

            const dist = this._dtwDistance(template, windowNorm, 0.3);
            if (dist < bestDist) {
                bestDist = dist;
                bestTemplateIdx = t;
            }
        }

        if (bestTemplateIdx >= 0 && bestDist <= this.matchThreshold) {
            console.log('✅ Template match! template=' + bestTemplateIdx + ' distance=' + bestDist.toFixed(3));
            this.framesSinceLastMatch = 0;
            if (this.onMatch) this.onMatch(bestDist, bestTemplateIdx);
        } else if (bestTemplateIdx >= 0) {
            // NEAR-MISS LOGGING: critical for tuning matchThreshold. Without
            // this, failed checks are invisible and you can't tell whether
            // the threshold is slightly too strict or wildly wrong.
            console.log('… no match. best=template' + bestTemplateIdx + ' distance=' + bestDist.toFixed(3) + ' (threshold=' + this.matchThreshold + ')');
        }
    }

    _zScoreNormalize(frames) {
        const nMels = frames[0].length;
        const mean = new Float32Array(nMels);
        const std = new Float32Array(nMels);

        for (const frame of frames) {
            for (let i = 0; i < nMels; i++) mean[i] += frame[i];
        }
        for (let i = 0; i < nMels; i++) mean[i] /= frames.length;

        for (const frame of frames) {
            for (let i = 0; i < nMels; i++) {
                const d = frame[i] - mean[i];
                std[i] += d * d;
            }
        }
        for (let i = 0; i < nMels; i++) std[i] = Math.sqrt(std[i] / frames.length) + 1e-8;

        return frames.map(frame => {
            const out = new Float32Array(nMels);
            for (let i = 0; i < nMels; i++) out[i] = (frame[i] - mean[i]) / std[i];
            return out;
        });
    }

    // Banded DTW, same normalization (distance / path length) as the Python prototype
    _dtwDistance(A, B, bandFrac = 0.3) {
        const n = A.length, m = B.length;
        const band = Math.floor(Math.max(n, m) * bandFrac);

        // D is (n+1) x (m+1), initialized to Infinity except D[0][0] = 0
        const D = [];
        for (let i = 0; i <= n; i++) D.push(new Float32Array(m + 1).fill(Infinity));
        D[0][0] = 0;

        for (let i = 1; i <= n; i++) {
            const jLo = Math.max(1, i - band);
            const jHi = Math.min(m, i + band);
            for (let j = jLo; j <= jHi; j++) {
                const cost = this._euclidean(A[i - 1], B[j - 1]);
                D[i][j] = cost + Math.min(D[i - 1][j], D[i][j - 1], D[i - 1][j - 1]);
            }
        }
        return D[n][m] / (n + m);
    }

    _euclidean(a, b) {
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            const d = a[i] - b[i];
            sum += d * d;
        }
        return Math.sqrt(sum);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MantraTemplateMatcher;
}
