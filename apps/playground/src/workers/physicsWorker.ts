// Quantum Lab Physics Engine Web Worker
// Solves time-dependent Schrödinger equation using Split-Step Fourier Method (FFT Strang Splitting)

export type QuantumStatePayload = {
  type: "STEP_QUANTUM_TUNNELING";
  params: {
    barrierHeight: number;  // eV
    barrierWidth: number;   // nm
    incidentEnergy: number; // eV
    particleMass: number;   // normalized mass
    reset?: boolean;
  };
} | {
  type: "CALCULATE_INTERFERENCE";
  params: {
    wavelength: number;
    slitSeparation: number;
    slitWidth: number;
    screenDistance: number;
  };
};

// Simple Complex Number helpers
type Complex = { re: number; im: number };

function expComplex(phi: number): Complex {
  return { re: Math.cos(phi), im: Math.sin(phi) };
}

function mulComplex(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

// Cooley-Tukey Radix-2 FFT (In-place)
function fftInPlace(re: Float64Array, im: Float64Array, inverse: boolean) {
  const n = re.length;
  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
    let k = n >> 1;
    while (k >= 1 && k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }

  for (let len = 2; len <= n; len <<= 1) {
    const halfLen = len >> 1;
    const angle = (inverse ? 2 * Math.PI : -2 * Math.PI) / len;
    const wStepRe = Math.cos(angle);
    const wStepIm = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let wRe = 1.0;
      let wIm = 0.0;
      for (let k = 0; k < halfLen; k++) {
        const pos = i + k;
        const match = pos + halfLen;

        const uRe = re[pos];
        const uIm = im[pos];
        const vRe = re[match] * wRe - im[match] * wIm;
        const vIm = re[match] * wIm + im[match] * wRe;

        re[pos] = uRe + vRe;
        im[pos] = uIm + vIm;
        re[match] = uRe - vRe;
        im[match] = uIm - vIm;

        const nextWRe = wRe * wStepRe - wIm * wStepIm;
        const nextWIm = wRe * wStepIm + wIm * wStepRe;
        wRe = nextWRe;
        wIm = nextWIm;
      }
    }
  }

  if (inverse) {
    for (let i = 0; i < n; i++) {
      re[i] /= n;
      im[i] /= n;
    }
  }
}

// Simulation Grid State
const N = 256;
const L = 20.0; // Spatial domain length (-10 nm to +10 nm)
const dx = L / N;
const xArr = new Float64Array(N);
const kArr = new Float64Array(N);

for (let i = 0; i < N; i++) {
  xArr[i] = -L / 2 + i * dx;
  const kIdx = i < N / 2 ? i : i - N;
  kArr[i] = (2 * Math.PI * kIdx) / L;
}

let psiRe = new Float64Array(N);
let psiIm = new Float64Array(N);
let isInitialized = false;

function initWavePacket(x0: number, k0: number, sigma: number) {
  let normSum = 0;
  for (let i = 0; i < N; i++) {
    const x = xArr[i];
    const envelope = Math.exp(-Math.pow(x - x0, 2) / (4 * sigma * sigma));
    psiRe[i] = envelope * Math.cos(k0 * x);
    psiIm[i] = envelope * Math.sin(k0 * x);
    normSum += (psiRe[i] * psiRe[i] + psiIm[i] * psiIm[i]) * dx;
  }
  const normFactor = 1.0 / Math.sqrt(normSum);
  for (let i = 0; i < N; i++) {
    psiRe[i] *= normFactor;
    psiIm[i] *= normFactor;
  }
  isInitialized = true;
}

// Split-Step Evolution Step
function stepSchrodinger(height: number, width: number, energy: number, mass: number) {
  if (!isInitialized) {
    initWavePacket(-5.0, Math.sqrt(2 * mass * energy), 0.8);
  }

  const dt = 0.04;
  const hbar = 1.0;

  // Define rectangular potential barrier V(x)
  const barrierStart = -width / 2;
  const barrierEnd = width / 2;
  const V = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    if (xArr[i] >= barrierStart && xArr[i] <= barrierEnd) {
      V[i] = height;
    } else {
      V[i] = 0.0;
    }
  }

  // 1. Half-step position phase
  for (let i = 0; i < N; i++) {
    const phaseV = - (V[i] * dt) / (2 * hbar);
    const pExp = expComplex(phaseV);
    const res = mulComplex({ re: psiRe[i], im: psiIm[i] }, pExp);
    psiRe[i] = res.re;
    psiIm[i] = res.im;
  }

  // 2. FFT to momentum space
  fftInPlace(psiRe, psiIm, false);

  // 3. Full-step momentum phase
  for (let i = 0; i < N; i++) {
    const k = kArr[i];
    const kineticEnergy = (hbar * hbar * k * k) / (2 * mass);
    const phaseK = - (kineticEnergy * dt) / hbar;
    const pExp = expComplex(phaseK);
    const res = mulComplex({ re: psiRe[i], im: psiIm[i] }, pExp);
    psiRe[i] = res.re;
    psiIm[i] = res.im;
  }

  // 4. IFFT back to position space
  fftInPlace(psiRe, psiIm, true);

  // 5. Half-step position phase
  for (let i = 0; i < N; i++) {
    const phaseV = - (V[i] * dt) / (2 * hbar);
    const pExp = expComplex(phaseV);
    const res = mulComplex({ re: psiRe[i], im: psiIm[i] }, pExp);
    psiRe[i] = res.re;
    psiIm[i] = res.im;
  }

  // Compute probability density & transmission coefficient T
  const density = new Float32Array(N);
  let transmittedProb = 0.0;

  for (let i = 0; i < N; i++) {
    const d = psiRe[i] * psiRe[i] + psiIm[i] * psiIm[i];
    density[i] = d;
    if (xArr[i] > barrierEnd) {
      transmittedProb += d * dx;
    }
  }

  // Analytical reference transmission coefficient
  let analyticalT = 0.0;
  if (energy < height) {
    const kappa = Math.sqrt(2 * mass * (height - energy));
    const sinhVal = Math.sinh(kappa * width);
    analyticalT = 1.0 / (1.0 + (height * height * sinhVal * sinhVal) / (4 * energy * (height - energy)));
  } else {
    const k2 = Math.sqrt(2 * mass * (energy - height));
    const sinVal = Math.sin(k2 * width);
    analyticalT = 1.0 / (1.0 + (height * height * sinVal * sinVal) / (4 * energy * (energy - height)));
  }

  return {
    density: Array.from(density),
    xArr: Array.from(xArr),
    transmission: Math.min(1.0, Math.max(0.0, transmittedProb * 1.5)),
    analyticalT: Math.min(1.0, Math.max(0.0, analyticalT)),
    barrierStart,
    barrierEnd,
  };
}

self.onmessage = (event: MessageEvent<QuantumStatePayload>) => {
  const data = event.data;
  if (data.type === "STEP_QUANTUM_TUNNELING") {
    if (data.params.reset) {
      isInitialized = false;
    }
    const result = stepSchrodinger(
      data.params.barrierHeight,
      data.params.barrierWidth,
      data.params.incidentEnergy,
      data.params.particleMass
    );
    self.postMessage({ type: "QUANTUM_TUNNELING_UPDATE", payload: result });
  } else if (data.type === "CALCULATE_INTERFERENCE") {
    const { wavelength, slitSeparation, slitWidth, screenDistance } = data.params;
    const numPoints = 128;
    const screenWidth = 10.0;
    const intensity = new Float32Array(numPoints);
    const yArr = new Float32Array(numPoints);

    const k = (2 * Math.PI) / wavelength;
    const d = slitSeparation;
    const a = slitWidth;

    for (let i = 0; i < numPoints; i++) {
      const y = -screenWidth / 2 + (i * screenWidth) / numPoints;
      yArr[i] = y;
      const theta = Math.atan2(y, screenDistance);
      const beta = (k * a * Math.sin(theta)) / 2;
      const alpha = (k * d * Math.sin(theta)) / 2;

      const singleSlitDiffraction = beta === 0 ? 1.0 : Math.pow(Math.sin(beta) / beta, 2);
      const doubleSlitInterference = Math.pow(Math.cos(alpha), 2);
      intensity[i] = singleSlitDiffraction * doubleSlitInterference;
    }

    self.postMessage({
      type: "INTERFERENCE_UPDATE",
      payload: {
        intensity: Array.from(intensity),
        yArr: Array.from(yArr),
      },
    });
  }
};
