// ── TAB SWITCHING ──

function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(name).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => {
    if (b.getAttribute('onclick')?.includes(name)) b.classList.add('active');
  });
}

// ── TIMER ──

let timerInterval = null;
let timerSeconds = 90;

function updateTimerDisplay() {
  const m = Math.floor(timerSeconds / 60);
  const s = timerSeconds % 60;
  document.getElementById('timerDisplay').textContent = `${m}:${s.toString().padStart(2,'0')}`;
}

function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    if (timerSeconds <= 0) { clearInterval(timerInterval); timerInterval = null; return; }
    timerSeconds--;
    updateTimerDisplay();
  }, 1000);
  toggleSquareBreath();
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerSeconds = 90;
  updateTimerDisplay();
  stopSquareBreath();
}

// ── SQUARE BREATHING ──

let squareRunning = false;
let squareTimeout = null;
const phases = [
  { label: 'Inhale...', leds: ['sq-t1','sq-t2','sq-t3'], cls: 'inhale' },
  { label: 'Hold.', leds: ['sq-r1','sq-r2','sq-r3'], cls: 'hold' },
  { label: 'Exhale...', leds: ['sq-b1','sq-b2','sq-b3'], cls: 'inhale' },
  { label: 'Hold.', leds: ['sq-l1','sq-l2','sq-l3'], cls: 'hold' },
];
let currentPhase = 0;
let currentLed = 0;
const LED_INTERVAL = 1000;

function toggleSquareBreath() {
  squareRunning ? stopSquareBreath() : startSquareBreath();
}

function startSquareBreath() {
  squareRunning = true;
  document.getElementById('squareStart').textContent = '■';
  currentPhase = 0; currentLed = 0;
  clearAllLeds(); runPhase();
}

function stopSquareBreath() {
  squareRunning = false;
  document.getElementById('squareStart').textContent = '▶';
  document.getElementById('squareLabel').textContent = 'Press to begin';
  clearAllLeds();
  if (squareTimeout) clearTimeout(squareTimeout);
}

function clearAllLeds() {
  document.querySelectorAll('.sq-led').forEach(l => l.classList.remove('inhale','hold'));
}

function runPhase() {
  if (!squareRunning) return;
  const phase = phases[currentPhase];
  document.getElementById('squareLabel').textContent = phase.label;
  currentLed = 0;
  lightNextLed(phase);
}

function lightNextLed(phase) {
  if (!squareRunning) return;
  if (currentLed < phase.leds.length) {
    document.getElementById(phase.leds[currentLed])?.classList.add(phase.cls);
    currentLed++;
    squareTimeout = setTimeout(() => lightNextLed(phase), LED_INTERVAL);
  } else {
    squareTimeout = setTimeout(() => {
      clearAllLeds();
      currentPhase = (currentPhase + 1) % phases.length;
      squareTimeout = setTimeout(runPhase, 200);
    }, 400);
  }
}

// ── WAVE CANVAS (ideal line) ──

function drawIdealWave() {
  const canvas = document.getElementById('breathCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = '#2472c8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < W; x++) {
    const y = H/2 + Math.sin(x / W * Math.PI * 4) * (H/3);
    x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
}

drawIdealWave();

// ── EXPRESSION TRAINER ──

let faceMesh;
let trainerCamera;
let currentExpression = 0;
let baseline = null;
let calibrationSamples = [];
let lastLoggedExpression = null;

const EXPRESSIONS = [
  {
    name: 'Genuine Smile',
    hint: 'Raise your cheeks, let your eyes squint slightly.',
    check: (lm, b) => {
      const mouthWidth = dist(lm[61], lm[291]) / dist(lm[234], lm[454]);
      const eyeL = dist(lm[159], lm[145]) / dist(lm[234], lm[454]);
      const eyeR = dist(lm[386], lm[374]) / dist(lm[234], lm[454]);
      const smileScore = clamp((mouthWidth - b.mouthWidth) / (b.mouthWidth * 0.15));
      const squintScore = clamp((b.eyeAvg - (eyeL + eyeR) / 2) / (b.eyeAvg * 0.15));
      return {
        scores: [
          { label: 'Mouth wide', val: smileScore },
          { label: 'Eyes squinting', val: squintScore },
          { label: 'Overall smile', val: (smileScore + squintScore) / 2 },
        ],
        match: smileScore > 0.6 && squintScore > 0.4
      };
    }
  },
  {
    name: 'Surprise',
    hint: 'Raise both eyebrows high, open eyes wide, drop jaw.',
    check: (lm, b) => {
      const jawDrop = dist(lm[13], lm[14]) / dist(lm[10], lm[152]);
      const browL = dist(lm[70], lm[63]) / dist(lm[234], lm[454]);
      const browR = dist(lm[300], lm[293]) / dist(lm[234], lm[454]);
      const eyeL = dist(lm[159], lm[145]) / dist(lm[234], lm[454]);
      const eyeR = dist(lm[386], lm[374]) / dist(lm[234], lm[454]);
      const jawScore = clamp((jawDrop - b.jawDrop) / (b.jawDrop * 0.3));
      const browScore = clamp(((browL + browR) / 2 - b.browAvg) / (b.browAvg * 0.2));
      const eyeScore = clamp(((eyeL + eyeR) / 2 - b.eyeAvg) / (b.eyeAvg * 0.2));
      return {
        scores: [
          { label: 'Jaw dropped', val: jawScore },
          { label: 'Brows raised', val: browScore },
          { label: 'Eyes wide', val: eyeScore },
        ],
        match: jawScore > 0.5 && browScore > 0.5
      };
    }
  },
  {
    name: 'Concerned',
    hint: 'Pull eyebrows together and down toward the center.',
    check: (lm, b) => {
      const browGap = dist(lm[70], lm[300]) / dist(lm[234], lm[454]);
      const browL = dist(lm[70], lm[63]) / dist(lm[234], lm[454]);
      const browR = dist(lm[300], lm[293]) / dist(lm[234], lm[454]);
      const gapScore = clamp((b.browGap - browGap) / (b.browGap * 0.15));
      const downL = clamp((b.browAvg - browL) / (b.browAvg * 0.1));
      const downR = clamp((b.browAvg - browR) / (b.browAvg * 0.1));
      return {
        scores: [
          { label: 'Brows together', val: gapScore },
          { label: 'Left brow down', val: downL },
          { label: 'Right brow down', val: downR },
        ],
        match: gapScore > 0.5 && (downL + downR) / 2 > 0.3
      };
    }
  },
  {
    name: 'Skeptical',
    hint: 'Raise just one eyebrow, keep the other still.',
    check: (lm, b) => {
      const browL = dist(lm[70], lm[63]) / dist(lm[234], lm[454]);
      const browR = dist(lm[300], lm[293]) / dist(lm[234], lm[454]);
      const asymmetry = Math.abs(browL - browR);
      const highBrow = Math.max(browL, browR);
      const asymScore = clamp((asymmetry - b.browAsymmetry) / 0.012);
      const raiseScore = clamp((highBrow - b.browAvg) / (b.browAvg * 0.15));
      return {
        scores: [
          { label: 'Brow asymmetry', val: asymScore },
          { label: 'One brow raised', val: raiseScore },
          { label: 'Other brow still', val: clamp(1 - Math.min(browL, browR) / b.browAvg * 0.5) },
        ],
        match: asymScore > 0.5 && raiseScore > 0.4
      };
    }
  },
  {
    name: 'Disgust',
    hint: 'Scrunch your nose, raise your upper lip, furrow brows.',
    check: (lm, b) => {
      const noseWidth = dist(lm[129], lm[358]) / dist(lm[234], lm[454]);
      const upperLip = dist(lm[0], lm[17]) / dist(lm[10], lm[152]);
      const browGap = dist(lm[70], lm[300]) / dist(lm[234], lm[454]);
      const noseScore = clamp((noseWidth - b.noseWidth) / (b.noseWidth * 0.08));
      const lipScore = clamp((b.upperLip - upperLip) / (b.upperLip * 0.1));
      const browScore = clamp((b.browGap - browGap) / (b.browGap * 0.1));
      return {
        scores: [
          { label: 'Nose scrunched', val: noseScore },
          { label: 'Upper lip raised', val: lipScore },
          { label: 'Brows furrowed', val: browScore },
        ],
        match: noseScore > 0.4 && lipScore > 0.3
      };
    }
  },
  {
    name: 'Polite but Uncomfortable',
    hint: 'Slight smile, but eyes stay flat and tense.',
    check: (lm, b) => {
      const mouthWidth = dist(lm[61], lm[291]) / dist(lm[234], lm[454]);
      const eyeL = dist(lm[159], lm[145]) / dist(lm[234], lm[454]);
      const eyeR = dist(lm[386], lm[374]) / dist(lm[234], lm[454]);
      const eyeAvg = (eyeL + eyeR) / 2;
      const smileScore = clamp((mouthWidth - b.mouthWidth) / (b.mouthWidth * 0.08));
      const eyeFlat = clamp(1 - Math.abs(eyeAvg - b.eyeAvg) / (b.eyeAvg * 0.1));
      return {
        scores: [
          { label: 'Slight smile', val: smileScore },
          { label: 'Eyes flat', val: eyeFlat },
          { label: 'Tension held', val: (smileScore + eyeFlat) / 2 },
        ],
        match: smileScore > 0.3 && eyeFlat > 0.6
      };
    }
  },
];

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function clamp(v) {
  return Math.max(0, Math.min(1, v));
}

function computeBaseline(samples) {
  const avg = (fn) => samples.reduce((a, lm) => a + fn(lm), 0) / samples.length;
  return {
    mouthWidth: avg(lm => dist(lm[61], lm[291]) / dist(lm[234], lm[454])),
    eyeAvg: avg(lm => (dist(lm[159], lm[145]) + dist(lm[386], lm[374])) / 2 / dist(lm[234], lm[454])),
    browAvg: avg(lm => (dist(lm[70], lm[63]) + dist(lm[300], lm[293])) / 2 / dist(lm[234], lm[454])),
    browGap: avg(lm => dist(lm[70], lm[300]) / dist(lm[234], lm[454])),
    browAsymmetry: avg(lm => Math.abs(dist(lm[70], lm[63]) - dist(lm[300], lm[293])) / dist(lm[234], lm[454])),
    jawDrop: avg(lm => dist(lm[13], lm[14]) / dist(lm[10], lm[152])),
    noseWidth: avg(lm => dist(lm[129], lm[358]) / dist(lm[234], lm[454])),
    upperLip: avg(lm => dist(lm[0], lm[17]) / dist(lm[10], lm[152])),
  };
}

function renderExpression() {
  const e = EXPRESSIONS[currentExpression];
  document.getElementById('targetName').textContent = e.name;
  document.getElementById('targetHint').textContent = 'Hint: ' + e.hint;
  document.getElementById('feedbackBars').innerHTML = '';
  document.getElementById('matchScore').textContent = baseline ? 'Make the expression!' : 'Calibrating...';
  document.getElementById('matchScore').style.background = 'var(--purple)';
}

function nextExpression() {
  currentExpression = (currentExpression + 1) % EXPRESSIONS.length;
  lastLoggedExpression = null;
  renderExpression();
}

function startTrainer() {
  document.getElementById('cameraOverlay').style.display = 'none';
  document.getElementById('trainerStartBtn').textContent = 'Camera On';
  document.getElementById('trainerStartBtn').disabled = true;

  const video = document.getElementById('trainerVideo');
  const canvas = document.getElementById('trainerCanvas');
  const ctx = canvas.getContext('2d');

  faceMesh = new FaceMesh({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}` });
  faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

  let calibrationCount = 0;
  const CALIBRATION_FRAMES = 40;

  faceMesh.onResults(results => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.multiFaceLandmarks || !results.multiFaceLandmarks[0]) {
      document.getElementById('matchScore').textContent = 'No face detected — move closer';
      return;
    }

    const lm = results.multiFaceLandmarks[0];

    ctx.fillStyle = 'rgba(100, 83, 147, 0.6)';
    [61, 291, 159, 145, 386, 374, 70, 300, 13, 14, 129, 358].forEach(i => {
      ctx.beginPath();
      ctx.arc(lm[i].x * canvas.width, lm[i].y * canvas.height, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    if (!baseline) {
      calibrationSamples.push(lm);
      calibrationCount++;
      const pct = Math.round((calibrationCount / CALIBRATION_FRAMES) * 100);
      document.getElementById('matchScore').textContent = `Calibrating... ${pct}%`;
      document.getElementById('matchScore').style.background = 'var(--blue)';
      if (calibrationCount >= CALIBRATION_FRAMES) {
        baseline = computeBaseline(calibrationSamples);
        document.getElementById('matchScore').textContent = 'Calibrated! Make the expression.';
        document.getElementById('matchScore').style.background = 'var(--green)';
      }
      return;
    }

    const e = EXPRESSIONS[currentExpression];
    const result = e.check(lm, baseline);

    document.getElementById('feedbackBars').innerHTML = result.scores.map(s => `
      <div class="feedback-row">
        <span>${s.label}</span>
        <div class="feedback-bar">
          <div class="feedback-fill" style="width:${Math.round(s.val * 100)}%;background:${s.val > 0.7 ? 'var(--green)' : 'var(--blue)'}"></div>
        </div>
        <span style="width:30px;text-align:right;font-size:11px">${Math.round(s.val * 100)}%</span>
      </div>
    `).join('');

    const scoreAvg = result.scores.reduce((a, s) => a + s.val, 0) / result.scores.length;
    if (result.match) {
      document.getElementById('matchScore').textContent = '✓ Match! Press NEXT for the next expression.';
      document.getElementById('matchScore').style.background = 'var(--green)';
      if (lastLoggedExpression !== EXPRESSIONS[currentExpression].name) {
        lastLoggedExpression = EXPRESSIONS[currentExpression].name;
      }
    } else {
      document.getElementById('matchScore').textContent = `Keep going — ${Math.round(scoreAvg * 100)}% there`;
      document.getElementById('matchScore').style.background = 'var(--purple)';
    }
  });

  trainerCamera = new Camera(video, {
    onFrame: async () => { await faceMesh.send({ image: video }); },
    width: 640, height: 480
  });
  trainerCamera.start();

  document.getElementById('matchScore').textContent = 'Hold a neutral face for 2 seconds...';
  document.getElementById('matchScore').style.background = 'var(--blue)';
}

renderExpression();

// ── EMOTION READER ──

const FACE_IMAGES = [
  { path: 'faces/angry1.jpg', label: 'ANGRY' },
  { path: 'faces/angry2.jpg', label: 'ANGRY' },
  { path: 'faces/angry3.jpg', label: 'ANGRY' },
  { path: 'faces/angry4.jpg', label: 'ANGRY' },
  { path: 'faces/angry5.jpg', label: 'ANGRY' },
  { path: 'faces/EXCITED1.jpg', label: 'EXCITED' },
  { path: 'faces/EXCITED2.jpg', label: 'EXCITED' },
  { path: 'faces/EXCITED3.jpg', label: 'EXCITED' },
  { path: 'faces/EXCITED4.jpg', label: 'EXCITED' },
  { path: 'faces/EXCITED5.jpg', label: 'EXCITED' },
  { path: 'faces/scared 1.jpg', label: 'SCARED' },
  { path: 'faces/scared 2.jpg', label: 'SCARED' },
  { path: 'faces/scared 3.jpg', label: 'SCARED' },
  { path: 'faces/scared 4.jpg', label: 'SCARED' },
  { path: 'faces/scared 5.jpg', label: 'SCARED' },
  { path: 'faces/SURPRISED1.jpg', label: 'SURPRISED' },
  { path: 'faces/SURPRISED2.jpg', label: 'SURPRISED' },
  { path: 'faces/SURPRISED3.jpg', label: 'SURPRISED' },
  { path: 'faces/SURPRISED4.jpg', label: 'SURPRISED' },
  { path: 'faces/SURPRISED5.jpg', label: 'SURPRISED' },
];

let readerScore = 0;
let readerTotal = 0;
let readerQueue = [];
let readerIndex = 0;
const ROUND_SIZE = 5;

function startEmotionRound() {
  readerScore = 0;
  readerTotal = 0;
  readerIndex = 0;
  document.getElementById('readerScore').textContent = '0';
  document.getElementById('readerTotal').textContent = '0';
  document.getElementById('answerReveal').style.display = 'none';
  document.getElementById('logReaderBtn').style.display = 'none';
  const shuffled = [...FACE_IMAGES].sort(() => Math.random() - 0.5);
  readerQueue = shuffled.slice(0, ROUND_SIZE);
  loadReaderImage();
}

function loadReaderImage() {
  if (readerIndex >= ROUND_SIZE) {
    document.getElementById('faceDisplay').innerHTML = '';
    document.getElementById('choicesGrid').innerHTML = `<div style="grid-column:span 2;text-align:center;color:var(--text-muted);font-weight:700;padding:20px">Round complete! Score: ${readerScore}/${ROUND_SIZE}</div>`;
    document.getElementById('answerReveal').style.display = 'none';
    document.getElementById('logReaderBtn').style.display = 'block';
    return;
  }

  const item = readerQueue[readerIndex];
  document.getElementById('faceDisplay').innerHTML = `<img src="${item.path}" alt="face" />`;
  document.getElementById('choicesGrid').innerHTML = '';
  document.getElementById('answerReveal').style.display = 'none';
  // Show buttons immediately — don't wait for image to load
  showChoiceButtons(item.label);
}

function showChoiceButtons(knownLabel) {
  const allLabels = ['ANGRY', 'EXCITED', 'SCARED', 'SURPRISED'];
  const correctIdx = allLabels.indexOf(knownLabel);
  document.getElementById('choicesGrid').innerHTML = allLabels.map((c, i) =>
    `<button class="choice-btn hover-lift" onclick="checkReaderAnswer(${i}, ${correctIdx})">${c}</button>`
  ).join('');
}

function checkReaderAnswer(chosen, correct) {
  readerTotal++;
  document.getElementById('readerTotal').textContent = readerTotal;

  document.querySelectorAll('.choice-btn').forEach((b, i) => {
    b.disabled = true;
    if (i === correct) b.classList.add('correct');
    else if (i === chosen) b.classList.add('wrong');
  });

  if (chosen === correct) {
    readerScore++;
    document.getElementById('readerScore').textContent = readerScore;
    document.getElementById('answerCorrect').textContent = '✓ Correct!';
  } else {
    document.getElementById('answerCorrect').textContent = '✗ Not quite';
  }

  const allLabels = ['ANGRY', 'EXCITED', 'SCARED', 'SURPRISED'];
  const knownLabel = allLabels[correct];
  const explanations = {
    ANGRY: 'Look for furrowed brows pulled together, a raised upper lip, and tense jaw muscles.',
    EXCITED: 'Wide eyes, raised brows, and an open smile — the whole face is activated and energized.',
    SCARED: 'Brows raised and pulled together, eyes wide open, and the mouth slightly open or tense.',
    SURPRISED: 'Brows raised high, eyes very wide, and jaw dropped — an open, unguarded reaction.',
  };

  document.getElementById('answerExplanation').textContent = explanations[knownLabel];
  document.getElementById('answerReveal').style.display = 'flex';
  readerIndex++;
}

function nextFace() {
  document.getElementById('answerReveal').style.display = 'none';
  loadReaderImage();
}

function logReaderScore() {
  autoLog('social', `Emotion Reader — scored ${readerScore}/${ROUND_SIZE} in round`);
  document.getElementById('logReaderBtn').style.display = 'none';
}
function resetEmotionReader() {
  readerScore = 0;
  readerTotal = 0;
  readerIndex = 0;
  document.getElementById('readerScore').textContent = '0';
  document.getElementById('readerTotal').textContent = '0';
  document.getElementById('answerReveal').style.display = 'none';
  document.getElementById('logReaderBtn').style.display = 'none';
  document.getElementById('choicesGrid').innerHTML = '<div class="choice-placeholder">Start a round to begin</div>';
  document.getElementById('faceDisplay').innerHTML = '<button class="btn-blue hover-lift" onclick="startEmotionRound()">Start Round</button>';
}
// ── LOG ──

let logEntries = JSON.parse(localStorage.getItem('baseline_log') || '[]');

document.getElementById('logIntensity').addEventListener('input', function() {
  document.getElementById('intensityVal').textContent = this.value;
});

document.getElementById('logIntensity2').addEventListener('input', function() {
  document.getElementById('intensity2Val').textContent = this.value;
});

function addLogEntry() {
  const note = document.getElementById('logNote').value.trim();
  const feel = document.getElementById('logFeel').value.trim();
  const cause = document.getElementById('logCause').value.trim();
  const action = document.getElementById('logAction').value.trim();
  if (!note && !feel) return;

  const category = document.getElementById('logCategory').value;
  const intensity1 = document.getElementById('logIntensity').value;
  const intensity2 = document.getElementById('logIntensity2').value;

  const entryText = [
    note && `What happened: ${note}`,
    feel && `Feeling: ${feel}`,
    `Intensity before: ${intensity1}/10`,
    cause && `Cause: ${cause}`,
    action && `Action: ${action}`,
    `Intensity after breathing: ${intensity2}/10`,
  ].filter(Boolean).join(' | ');

  logEntries.unshift({
    id: Date.now(),
    date: new Date().toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' }),
    category,
    note: entryText,
  });

  localStorage.setItem('baseline_log', JSON.stringify(logEntries));
  document.getElementById('logNote').value = '';
  document.getElementById('logFeel').value = '';
  document.getElementById('logCause').value = '';
  document.getElementById('logAction').value = '';
  renderLog();
  showTab('reflection');
}

function autoLog(category, note) {
  logEntries.unshift({
    id: Date.now(),
    date: new Date().toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit' }),
    category,
    note,
  });
  localStorage.setItem('baseline_log', JSON.stringify(logEntries));
  renderLog();
}

function renderLog() {
  const list = document.getElementById('logList');
  if (!logEntries.length) {
    list.innerHTML = '<p class="empty-state">No entries yet.</p>';
    return;
  }
  list.innerHTML = logEntries.map(e => `
    <div class="log-entry ${e.category}">
      <div class="log-entry-meta">${e.date} · ${e.category}</div>
      <div class="log-entry-note">${e.note}</div>
    </div>
  `).join('');
}

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFont('helvetica','bold');
  doc.setFontSize(18);
  doc.text('Baseline — Self-Reflection Log', 20, 24);
  doc.setFont('helvetica','normal');
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Exported ${new Date().toLocaleDateString()}`, 20, 32);
  doc.setTextColor(0);
  let y = 44;
  logEntries.forEach(e => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFont('helvetica','bold');
    doc.setFontSize(11);
    doc.text(`${e.date} — ${e.category.toUpperCase()}`, 20, y);
    y += 6;
    doc.setFont('helvetica','normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(e.note, 170);
    doc.text(lines, 20, y);
    y += lines.length * 5 + 10;
  });
  doc.save('baseline-log.pdf');
}
function resetLogs() {
  if (!confirm('Delete all log entries? This cannot be undone.')) return;
  logEntries = [];
  localStorage.removeItem('baseline_log');
  renderLog();
}

renderLog();