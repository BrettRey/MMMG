import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DualSigmoidModel = () => {
  // State variables for parameters
  const [initialC, setInitialC] = useState(0.1);
  const [initialF, setInitialF] = useState(-0.9);
  const [initialFreq, setInitialFreq] = useState(0.5);
  const [alpha, setAlpha] = useState(1.0);
  const [beta, setBeta] = useState(1.0);
  const [gamma, setGamma] = useState(0.5);
  const [kSteepness, setKSteepness] = useState(0.2);
  const [tMid, setTMid] = useState(25);
  const [fKSteepness, setFKSteepness] = useState(0.2);
  const [fTMid, setFTMid] = useState(18);
  const [delta, setDelta] = useState(0.1);
  const [freqMax, setFreqMax] = useState(3.0);
  const [cMax, setCMax] = useState(1.0);
  const [fMin, setFMin] = useState(-1.0);
  const [fMax, setFMax] = useState(0.0);
  const [timeSteps, setTimeSteps] = useState(50);
  const [useLogFreq, setUseLogFreq] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [exampleSentence, setExampleSentence] = useState("I've finished it yesterday");
  
  // Predefined examples
  const examples = [
    { 
      label: "I've finished it yesterday", 
      initialC: 0.1, initialF: -0.9, initialFreq: 0.5,
      alpha: 1.0, beta: 1.0, gamma: 0.5,
      kSteepness: 0.2, tMid: 25, 
      fKSteepness: 0.2, fTMid: 18,
      delta: 0.1, freqMax: 3.0, cMax: 1.0
    },
    { 
      label: "It very good", 
      initialC: 0.1, initialF: -0.95, initialFreq: 0.8,
      alpha: 1.2, beta: 0.8, gamma: 0.6,
      kSteepness: 0.2, tMid: 25, 
      fKSteepness: 0.22, fTMid: 16,
      delta: 0.15, freqMax: 3.0, cMax: 1.0
    },
    { 
      label: "We sheared three sheeps", 
      initialC: 0.05, initialF: -0.92, initialFreq: 0.2,
      alpha: 0.8, beta: 1.2, gamma: 0.4,
      kSteepness: 0.18, tMid: 30, 
      fKSteepness: 0.19, fTMid: 22,
      delta: 0.08, freqMax: 3.0, cMax: 1.0
    },
    { 
      label: "I saw Joan, a friend of whose was visiting", 
      initialC: 0.3, initialF: -0.85, initialFreq: 0.4,
      alpha: 0.9, beta: 0.9, gamma: 0.5,
      kSteepness: 0.2, tMid: 25, 
      fKSteepness: 0.21, fTMid: 19,
      delta: 0.05, freqMax: 3.0, cMax: 1.0
    }
  ];

  // Calculate phi function
  const calculatePhi = (c, freq, f, alpha, beta, gamma, freqMax) => {
    const normalizedFreq = freq / freqMax;
    return Math.max(0, alpha * normalizedFreq + beta * (f + 1) + gamma * c);
  };
  
  // Calculate phi offset to ensure C starts at initialC
  const calculatePhiOffset = (initialC, initialF, initialFreq, alpha, beta, gamma, freqMax, kSteepness, tMid, cMax) => {
    // Calculate standard phi
    const standardPhi = calculatePhi(initialC, initialFreq, initialF, alpha, beta, gamma, freqMax);
    
    // Calculate required phi to produce initialC at t=0
    // This comes from solving the equation: initialC = cMax / (1 + exp(-k * (0 - tMid + phi + offset)))
    return tMid - standardPhi + Math.log((cMax / initialC) - 1) / -kSteepness;
  };

  // Calculate C(u) using sigmoid function
  const calculateC = (t, c, freq, f, params, phiOffset) => {
    const { alpha, beta, gamma, kSteepness, tMid, freqMax, cMax } = params;
    const phi = calculatePhi(c, freq, f, alpha, beta, gamma, freqMax);
    return cMax / (1 + Math.exp(-kSteepness * (t - tMid + phi + phiOffset)));
  };

  // Calculate F(u) using independent sigmoid function
  const calculateF = (t, fKSteepness, fTMid, fMin, fMax) => {
    const fRange = fMax - fMin;
    return fMin + fRange / (1 + Math.exp(-fKSteepness * (t - fTMid)));
  };

  // Calculate frequency growth
  const calculateFreq = (freq, delta, c, f, useLogFreq) => {
    const normalizedF = f + 1.0;
    const influenceFactor = (c + normalizedF) / 2;
    
    if (useLogFreq) {
      return freq + delta * influenceFactor * Math.sqrt(freq + 0.1);
    } else {
      return freq + delta * influenceFactor * freq * 0.8;
    }
  };

  // Generate simulation data
  const generateSimulation = () => {
    // Parameters object
    const params = {
      alpha, beta, gamma, kSteepness, tMid, 
      freqMax, cMax
    };
    
    // Calculate the phi offset to ensure C starts at initialC
    const phiOffset = calculatePhiOffset(
      initialC, initialF, initialFreq, 
      alpha, beta, gamma, freqMax,
      kSteepness, tMid, cMax
    );
    
    // Initialize data array
    let data = [];
    let currentC = initialC;
    let currentFreq = initialFreq;
    
    for (let t = 0; t <= timeSteps; t++) {
      // Calculate F(u) for current time step
      const currentF = calculateF(t, fKSteepness, fTMid, fMin, fMax);
      
      // Calculate TPM for display
      const tpm = useLogFreq ? Math.exp(currentFreq) - 1 : currentFreq;
      
      // Calculate phi
      const currentPhi = calculatePhi(currentC, currentFreq, currentF, alpha, beta, gamma, freqMax);
      
      // Add data point
      data.push({
        time: t,
        c: currentC,
        f: currentF,
        freq: currentFreq,
        tpm: tpm,
        phi: currentPhi
      });
      
      // Skip updating values at the last time step
      if (t < timeSteps) {
        // Calculate the next C value with offset to ensure smooth curve
        currentC = calculateC(t, currentC, currentFreq, currentF, params, phiOffset);
        
        // Update frequency
        currentFreq = calculateFreq(currentFreq, delta, currentC, currentF, useLogFreq);
      }
    }
    
    setChartData(data);
  };

  // Load an example
  const loadExample = (example) => {
    setExampleSentence(example.label);
    setInitialC(example.initialC);
    setInitialF(example.initialF);
    setInitialFreq(example.initialFreq);
    setAlpha(example.alpha);
    setBeta(example.beta);
    setGamma(example.gamma);
    setKSteepness(example.kSteepness);
    setTMid(example.tMid);
    setFKSteepness(example.fKSteepness);
    setFTMid(example.fTMid);
    setDelta(example.delta);
    setFreqMax(example.freqMax);
    setCMax(example.cMax);
  };

  // Run simulation when parameters change
  useEffect(() => {
    generateSimulation();
  }, [
    initialC, initialF, initialFreq, 
    alpha, beta, gamma, 
    kSteepness, tMid, 
    fKSteepness, fTMid,
    delta, freqMax, cMax, 
    fMin, fMax,
    timeSteps, useLogFreq
  ]);

  // Custom tooltip formatter that correctly labels the series
  const customTooltipFormatter = (value, name) => {
    let label;
    if (name === 'c') {
      label = 'C(u)';
    } else if (name === 'f') {
      label = 'F(u)';
    } else if (name === 'freq') {
      label = useLogFreq ? 'log(TPM+1)' : 'TPM';
    } else if (name === 'phi') {
      label = 'φ value';
    } else {
      label = name;
    }
    return [value.toFixed(3), label];
  };

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Dual Sigmoid Model for Language Change</h1>
      <p className="mb-4">
        This model shows how grammatical feeling F(u) and community acceptance C(u) evolve 
        over time using independent sigmoid curves.
      </p>
      
      <div className="p-4 bg-blue-50 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Model Formulas:</h2>
        <div className="p-3 bg-white rounded shadow">
          <p className="font-mono text-center text-sm my-2">
            C(u) = C<sub>max</sub> / (1 + exp[-k<sub>C</sub>(t - t<sub>mid-C</sub> + φ)])
          </p>
          <p className="font-mono text-center text-sm my-2">
            F(u) = F<sub>min</sub> + (F<sub>max</sub> - F<sub>min</sub>) / (1 + exp[-k<sub>F</sub>(t - t<sub>mid-F</sub>)])
          </p>
          <p className="font-mono text-center text-sm my-2">
            φ(C(u), freq(u), F(u)) = α·(freq(u)/freq<sub>max</sub>) + β·(F(u) + 1) + γ·C(u)
          </p>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Current example: "{exampleSentence}"</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => loadExample(ex)}
              className={`px-3 py-1 text-sm rounded-full ${
                exampleSentence === ex.label
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {ex.label}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Parameters */}
          <div className="space-y-4">
            <h3 className="font-semibold">C(u) Parameters</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">Initial C(u): {initialC.toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={initialC}
                onChange={(e) => setInitialC(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">k<sub>C</sub> (steepness): {kSteepness.toFixed(2)}</label>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.01"
                value={kSteepness}
                onChange={(e) => setKSteepness(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">t<sub>mid-C</sub>: {tMid}</label>
              <input
                type="range"
                min="10"
                max="40"
                step="1"
                value={tMid}
                onChange={(e) => setTMid(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <h3 className="font-semibold pt-4">F(u) Parameters</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">k<sub>F</sub> (steepness): {fKSteepness.toFixed(2)}</label>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.01"
                value={fKSteepness}
                onChange={(e) => setFKSteepness(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">t<sub>mid-F</sub>: {fTMid}</label>
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                value={fTMid}
                onChange={(e) => setFTMid(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Set lower than t<sub>mid-C</sub> to make F(u) lead</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Time steps: {timeSteps}</label>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={timeSteps}
                onChange={(e) => setTimeSteps(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <h3 className="font-semibold pt-4">Other Parameters</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">α (alpha): {alpha.toFixed(2)}</label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={alpha}
                onChange={(e) => setAlpha(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">β (beta): {beta.toFixed(2)}</label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={beta}
                onChange={(e) => setBeta(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">γ (gamma): {gamma.toFixed(2)}</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={gamma}
                onChange={(e) => setGamma(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Column 2: Charts */}
          <div className="space-y-4">
            <div className="h-64">
              <h3 className="text-center font-semibold mb-2">Combined F(u) and C(u)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[-1, 1]} />
                  <Tooltip 
                    formatter={customTooltipFormatter}
                    labelFormatter={(value) => `Time: ${value}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="c"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    name="c"
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="f"
                    stroke="#dc2626"
                    strokeWidth={2}
                    dot={false}
                    name="f"
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-center mt-1 text-sm">
                <div className="flex items-center mr-4">
                  <div className="w-3 h-3 bg-blue-600 mr-1"></div>
                  <span>C(u)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-600 mr-1"></div>
                  <span>F(u)</span>
                </div>
              </div>
            </div>
            
            <div className="h-64">
              <h3 className="text-center font-semibold mb-2">Frequency</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip 
                    formatter={customTooltipFormatter}
                    labelFormatter={(value) => `Time: ${value}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="freq"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={false}
                    name="freq"
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="h-64">
              <h3 className="text-center font-semibold mb-2">S-Curve Modifier φ</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip 
                    formatter={customTooltipFormatter}
                    labelFormatter={(value) => `Time: ${value}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="phi"
                    stroke="#9333ea"
                    strokeWidth={2}
                    dot={false}
                    name="phi"
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">About this Model:</h3>
        <ul className="list-disc pl-6 space-y-1 text-sm">
          <li>The key innovation is modeling F(u) with its own independent sigmoid curve.</li>
          <li>F(u) leads C(u) when t<sub>mid-F</sub> is set to a lower value than t<sub>mid-C</sub>.</li>
          <li>Both curves follow the natural S-curve pattern seen in language change.</li>
          <li>Frequency grows as a function of both community acceptance and grammatical feeling.</li>
          <li>This model avoids artificial manipulations that can create unintended artifacts in the curves.</li>
          <li>The combined view shows how grammatical feeling shifts can precede community acceptance.</li>
        </ul>
      </div>
    </div>
  );
};

export default DualSigmoidModel;
