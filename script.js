let currentPaletteFilter = "rgb";
let circles = [];
let editingIndex = -1;

document.querySelectorAll('input[name="palette"]').forEach(radio => {
  radio.addEventListener('change', e => {
    currentPaletteFilter = e.target.value;
    circles.forEach(c => c.weight = 0); // 믹싱 초기화
    render();
  });
});

// Nebula 배경 애니메이션 WebGL 코드
const canvas = document.getElementById("bg-canvas");
const gl = canvas.getContext("webgl");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Shader 소스 코드
const vsSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fsSource = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_color;

  float rand(vec2 co){
    return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
  }

  float noise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = rand(i);
    float b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0));
    float d = rand(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
           (c - a)* u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = uv * 3.0;
    float t = u_time * 0.05;
    float n = noise(p + vec2(t, -t));
    vec3 col = u_color * n * 1.5;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// Shader 초기화
function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

const vs = createShader(gl.VERTEX_SHADER, vsSource);
const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
gl.useProgram(program);

// 사각형 버퍼
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1, -1, 1, -1, -1, 1,
  -1, 1, 1, -1, 1, 1
]), gl.STATIC_DRAW);

const pos = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(pos);
gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

// Uniform 설정
const uTime = gl.getUniformLocation(program, "u_time");
const uRes = gl.getUniformLocation(program, "u_resolution");
const uColor = gl.getUniformLocation(program, "u_color");

// 현재 색상 (r, g, b 범위: 0~1)
let currentColor = [0.5, 0.5, 0.5];
let targetColor = [0.5, 0.5, 0.5];

// 외부에서 색상 갱신용 함수
function updateShaderTarget(r, g, b) {
  targetColor = [r, g, b];
}

// 애니메이션 루프
function animateShader(time) {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.uniform1f(uTime, time * 0.001);
  gl.uniform2f(uRes, canvas.width, canvas.height);

  // 색상 부드럽게 전환
  for (let i = 0; i < 3; i++) {
    currentColor[i] += (targetColor[i] - currentColor[i]) * 0.05;
  }

  gl.uniform3f(uColor, ...currentColor);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  requestAnimationFrame(animateShader);
}

requestAnimationFrame(animateShader);

const DEFAULT_COLORS = [
  { r: 255, g: 0, b: 0, type: "rgb" },
  { r: 0, g: 255, b: 0, type: "rgb" },
  { r: 0, g: 0, b: 255, type: "rgb" },
  { r: 0, g: 255, b: 255, type: "cmy" },
  { r: 255, g: 0, b: 255, type: "cmy" },
  { r: 255, g: 255, b: 0, type: "cmy" },
  { r: 255, g: 255, b: 255, type: "wb" },
  { r: 0, g: 0, b: 0, type: "wb" },
  { r: 5, g: 173, b: 237, type: "cmy-mrhobby" },   // C
  { r: 235, g: 3, b: 142, type: "cmy-mrhobby" },   // M
  { r: 252, g: 241, b: 7, type: "cmy-mrhobby" },   // Y
  { r: 255, g: 255, b: 255, type: "cmy-mrhobby" }, // W
  { r: 0, g: 0, b: 0, type: "cmy-mrhobby" }        // B
];

function resetColors() {
  const presets = DEFAULT_COLORS.map(c => ({ color: { r: c.r, g: c.g, b: c.b }, weight: 0, type: c.type }));
  const customs = circles.filter(c => c.type === "custom").map(c => ({ ...c, weight: 0 }));
  circles = [...presets, ...customs];
  render();
}

function shouldShowColor(type) {
  if (currentPaletteFilter === "all") return true;
  if (currentPaletteFilter === "none") return type === "custom";
  if (currentPaletteFilter === "rgb") return ["rgb", "wb", "custom"].includes(type);
  if (currentPaletteFilter === "cmy") return ["cmy", "wb", "custom"].includes(type);
  if (currentPaletteFilter === "wb") return ["wb", "custom"].includes(type);
  if (currentPaletteFilter === "cmy-mrhobby") return ["cmy-mrhobby", "custom"].includes(type);
  return false;
}

function render() {
  const groupRGB = document.getElementById("group-rgb");
  const groupCMY = document.getElementById("group-cmy");
  const groupWB = document.getElementById("group-wb");
  const groupCustom = document.getElementById("group-custom");

  const titleRGB = groupRGB.previousElementSibling;
  const titleCMY = groupCMY.previousElementSibling;
  const titleWB = groupWB.previousElementSibling;
  const titleCustom = groupCustom.previousElementSibling;

  groupRGB.innerHTML = "";
  groupCMY.innerHTML = "";
  groupWB.innerHTML = "";
  groupCustom.innerHTML = "";

  titleRGB.style.display = groupRGB.style.display = (currentPaletteFilter === "rgb" || currentPaletteFilter === "all") ? "block" : "none";
  titleCMY.style.display = groupCMY.style.display = (currentPaletteFilter === "cmy" || currentPaletteFilter === "all" || currentPaletteFilter === "cmy-mrhobby") ? "block" : "none";
  titleWB.style.display = groupWB.style.display = ["rgb", "cmy", "wb", "all"].includes(currentPaletteFilter) ? "block" : "none";
  titleCustom.style.display = groupCustom.style.display = "block";

  circles.forEach((item, i) => {
    if (!shouldShowColor(item.type)) return;

    const wrap = document.createElement("div");
    wrap.className = "color-circle";

    const ball = document.createElement("div");
    ball.className = "color-ball";
    ball.style.background = rgbToHex(item.color);
    ball.onclick = () => openModal(i);

    const controls = document.createElement("div");
    controls.className = "counter-controls";

    const minus = document.createElement("button");
    minus.textContent = "−";
    minus.onclick = () => {
      item.weight = Math.max(0, item.weight - 1);
      render();
    };

    const plus = document.createElement("button");
    plus.textContent = "+";
    plus.onclick = () => {
      item.weight += 1;
      render();
    };

    const label = document.createElement("div");
    label.className = "color-value";
    label.textContent = item.weight > 0 ? item.weight : "";

    controls.appendChild(minus);
    controls.appendChild(label);
    controls.appendChild(plus);

    wrap.appendChild(ball);
    wrap.appendChild(controls);

    if (item.type === "custom") {
      const delBtn = document.createElement("div");
      delBtn.textContent = "❌";
      delBtn.className = "delete-btn";
      delBtn.onclick = () => {
        circles.splice(i, 1);
        render();
      };
      wrap.appendChild(delBtn);
    }

    if (item.type === "rgb") groupRGB.appendChild(wrap);
    else if (item.type === "cmy") groupCMY.appendChild(wrap);
    else if (item.type === "wb") groupWB.appendChild(wrap);
    else if (item.type === "cmy-mrhobby") groupCMY.appendChild(wrap); // Reuse CMY area
    else groupCustom.appendChild(wrap);
  });

  updateMix();
}

function rgbToHex({ r = 0, g = 0, b = 0 } = {}) {
  return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function parseColor(str) {
  if (/^#[0-9a-fA-F]{6}$/.test(str)) return hexToRgb(str);
  if (/^[\d\s]*,[\d\s]*,[\d\s]*$/.test(str)) {
    const parts = str.split(",").map(x => parseInt(x.trim()));
    if (parts.length === 3 && parts.every(x => x >= 0 && x <= 255)) {
      return { r: parts[0], g: parts[1], b: parts[2] };
    }
  }
  return null;
}

const targetColorInput = document.getElementById("targetColor");
const stepSlider = document.getElementById("stepSlider");
const stepValueText = document.getElementById("stepValue");

targetColorInput.addEventListener("input", updateTargetBox);
stepSlider.addEventListener("input", () => {
  stepValueText.textContent = stepSlider.value;
  circles.forEach(c => c.weight = 0);
  updateMix();
});

function updateTargetBox() {
  const value = targetColorInput.value.trim();
  const rgb = parseColor(value);
  if (rgb) {
    const hex = rgbToHex(rgb);
    document.getElementById("targetBox").style.background = hex;
    document.getElementById("targetText").textContent = `Target: ${hex.toUpperCase()}`;
  }
}

function updateMix() {
  let r = 0, g = 0, b = 0, total = 0;
  circles.forEach(({ color, weight }) => {
    r += color.r * weight;
    g += color.g * weight;
    b += color.b * weight;
    total += weight;
  });

  const resultBox = document.getElementById("resultBox");
  const resultText = document.getElementById("resultText");
  const similarityText = document.getElementById("similarityText");
  const ratioList = document.getElementById("ratioList");
  
  

  if (total === 0) {
    resultBox.style.background = "#000000";
    resultText.innerHTML = `#000000<br>RGB(0, 0, 0)<br><em>Unknown</em>`;
    similarityText.textContent = `Similarity: -`;
    ratioList.innerHTML = "";
    return;
  }

  const avg = { r: r / total, g: g / total, b: b / total };
  const hex = rgbToHex({
    r: Math.round(avg.r),
    g: Math.round(avg.g),
    b: Math.round(avg.b)
  });

  resultBox.style.background = hex;
  resultText.innerHTML = `${hex.toUpperCase()}<br>RGB(${Math.round(avg.r)}, ${Math.round(avg.g)}, ${Math.round(avg.b)})<br><em>Loading...</em>`;


  fetchColorNameFromAPI(hex).then(name => {
    resultText.innerHTML = `${hex.toUpperCase()}<br>RGB(${Math.round(avg.r)}, ${Math.round(avg.g)}, ${Math.round(avg.b)})<br><em>${name}</em>`;
  });

  const target = parseColor(targetColorInput.value.trim());
  if (target) {
    const similarity = calcSimilarity(avg, target);
    similarityText.textContent = `Similarity: ${similarity}%`;
  } else {
    similarityText.textContent = "Similarity: -";
  }

  const lines = circles
    .map(({ color, weight }) => ({ hex: rgbToHex(color), weight }))
    .filter((c) => c.weight > 0);

  const totalW = lines.reduce((a, b) => a + b.weight, 0);
  const stepValue = parseInt(stepSlider.value);

  ratioList.innerHTML =
    "<strong>Mixing Ratio:</strong><br>" +
    lines
      .map((c) => {
        const percent = Math.round((c.weight / totalW) * 100);
        const quotient = Math.floor(percent / stepValue);
        return `<span style="color:${c.hex}">${c.hex}</span>: ${percent}% → Step ${stepValue} → ${quotient}`;
      })
      .join("<br>");
}

function calcSimilarity(a, b) {
  const dist = Math.sqrt(
    (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2
  );
  const maxDist = Math.sqrt(255 ** 2 * 3);
  return Math.round(100 - (dist / maxDist) * 100);
}

async function fetchColorNameFromAPI(hex) {
  const cleanHex = hex.replace("#", "");
  try {
    const res = await fetch(`https://www.thecolorapi.com/id?hex=${cleanHex}`);
    const data = await res.json();
    return data.name.value || "Unknown";
  } catch {
    return "Unknown";
  }
}

function addColorCircle() {
  if (circles.filter(c => c.type === "custom").length >= 10) {
    alert("❗ Custom 색상은 최대 10개까지 추가할 수 있습니다.");
    return;
  }
  circles.push({ color: { r: 136, g: 136, b: 136 }, weight: 0, type: "custom" });
  render();
}

function openModal(index) {
  editingIndex = index;
  document.getElementById("colorInput").value = rgbToHex(circles[index].color);
  document.getElementById("colorPreview").value = rgbToHex(circles[index].color);
  document.getElementById("colorPickerModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("colorPickerModal").style.display = "none";
  editingIndex = -1;
}

function applyColor() {
  const str = document.getElementById("colorInput").value.trim();
  const rgb = parseColor(str);
  if (!rgb) {
    alert("❗ HEX (#ffffff) 또는 RGB (255,255,255) 형식으로 입력해주세요.");
    return;
  }
  circles[editingIndex].color = rgb;
  render();
  closeModal();
}

function saveMix() {
  const mix = circles.map(c => ({ ...c }));
  const target = parseColor(targetColorInput.value.trim());
  if (!target) {
    alert("❗ 유효한 Target Color가 필요합니다.");
    return;
  }

  let r = 0, g = 0, b = 0, total = 0;
  mix.forEach(({ color, weight }) => {
    r += color.r * weight;
    g += color.g * weight;
    b += color.b * weight;
    total += weight;
  });

  const mixed = total > 0
    ? { r: Math.round(r / total), g: Math.round(g / total), b: Math.round(b / total) }
    : { r: 0, g: 0, b: 0 };

  const time = new Date().toISOString();
  const stored = JSON.parse(localStorage.getItem("savedMixes") || "[]");
  stored.push({ time, mix, target, mixed, name: "" });
  localStorage.setItem("savedMixes", JSON.stringify(stored));
  renderSavedMixes();
}

function renderSavedMixes() {
  const list = document.getElementById("savedMixes");
  list.innerHTML = "";
  const stored = JSON.parse(localStorage.getItem("savedMixes") || "[]");

  stored.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "saved-item";

    const targetBox = document.createElement("div");
    targetBox.className = "mix-preview";
    targetBox.style.background = rgbToHex(item.target);
    targetBox.title = "Target Color";

    const mixedBox = document.createElement("div");
    mixedBox.className = "mix-preview";
    mixedBox.style.background = rgbToHex(item.mixed);
    mixedBox.title = "Mixed Color";

    const info = document.createElement("div");
    info.className = "info";
    info.innerHTML = `
      🎯 <strong>${rgbToHex(item.target).toUpperCase()}</strong><br>
      🧪 <strong>${rgbToHex(item.mixed).toUpperCase()}</strong><br>
      💯 <strong>Similarity:</strong> ${calcSimilarity(item.mixed, item.target)}%
    `;

    const nameInput = document.createElement("input");
    nameInput.className = "saved-name";
    nameInput.placeholder = "Mix Name";
    nameInput.value = item.name || "";
    nameInput.oninput = () => {
      stored[index].name = nameInput.value;
      localStorage.setItem("savedMixes", JSON.stringify(stored));
    };

    const loadBtn = document.createElement("button");
    loadBtn.textContent = "📥";

	
	loadBtn.onclick = () => {
  targetColorInput.value = rgbToHex(item.target);
  circles = item.mix.map(c => ({ ...c }));
  render();
  updateTargetBox();

  // ✅ 배경 WebGL 애니메이션 컬러 업데이트
  updateShaderTarget(item.target.r / 255, item.target.g / 255, item.target.b / 255);
};

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑";
    deleteBtn.onclick = () => {
      if (confirm("이 조합을 삭제하시겠습니까?")) {
        stored.splice(index, 1);
        localStorage.setItem("savedMixes", JSON.stringify(stored));
        renderSavedMixes();
      }
    };

    div.appendChild(targetBox);
    div.appendChild(mixedBox);
    div.appendChild(info);
    div.appendChild(nameInput);
    div.appendChild(loadBtn);
    div.appendChild(deleteBtn);
    list.appendChild(div);
  });
}

function findBestMix() {
  const step = parseInt(stepSlider.value);
  const target = parseColor(targetColorInput.value.trim());

  if (!target) {
    alert("❗ 유효한 HEX 또는 RGB 색상코드를 입력해주세요.");
    return;
  }

  const mixPool = circles.filter(c => shouldShowColor(c.type));
  if (!mixPool.length) {
    alert("❗ 사용할 수 있는 색상이 없습니다.");
    return;
  }

  const beamWidth = 20;
  const totalSteps = 100;

  let queue = [{
    weights: Array(mixPool.length).fill(0),
    r: 0, g: 0, b: 0, total: 0
  }];

  for (let stepCount = 0; stepCount < totalSteps; stepCount += step) {
    const nextQueue = [];

    for (const state of queue) {
      for (let i = 0; i < mixPool.length; i++) {
        const newWeights = [...state.weights];
        newWeights[i] += step;

        const newR = state.r + mixPool[i].color.r * step;
        const newG = state.g + mixPool[i].color.g * step;
        const newB = state.b + mixPool[i].color.b * step;
        const newTotal = state.total + step;

        const avg = {
          r: newR / newTotal,
          g: newG / newTotal,
          b: newB / newTotal
        };

        const dist = Math.sqrt(
          (avg.r - target.r) ** 2 +
          (avg.g - target.g) ** 2 +
          (avg.b - target.b) ** 2
        );

        nextQueue.push({
          weights: newWeights,
          r: newR,
          g: newG,
          b: newB,
          total: newTotal,
          dist
        });
      }
    }

    nextQueue.sort((a, b) => a.dist - b.dist);
    queue = nextQueue.slice(0, beamWidth);
  }

  const best = queue[0];
  if (!best) {
    alert("❗ 최적 조합을 찾을 수 없습니다.");
    return;
  }

  let j = 0;
  for (let i = 0; i < circles.length; i++) {
    if (shouldShowColor(circles[i].type)) {
      circles[i].weight = best.weights[j++];
    } else {
      circles[i].weight = 0;
    }
  }

  render();
  updateMix();

  const resultColor = {
    r: Math.round(best.r / best.total),
    g: Math.round(best.g / best.total),
    b: Math.round(best.b / best.total)
  };

  // Shader에 전달
  updateShaderTarget(resultColor.r / 255, resultColor.g / 255, resultColor.b / 255);
  
  
  // HEX 변환
const hex = rgbToHex(resultColor);
//updateAISuggestionBackground(hex);

// ✅ Suggestion section color picker도 업데이트
  const colorPicker = document.querySelector(".suggestion-section input[type='color']");
  if (colorPicker) {
    colorPicker.value = hex;
  }
}

// HEX → RGB 변환 유틸리티
function hexToRgbNormalized(hex) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return [r, g, b];
}

function downloadMixes() {
  const stored = JSON.parse(localStorage.getItem("savedMixes") || "[]");
  const blob = new Blob([JSON.stringify(stored, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "smart-color-mixes.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function uploadMixes(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error("Invalid data");

      localStorage.setItem("savedMixes", JSON.stringify(data));
      renderSavedMixes();
      alert("✅ 저장된 조합이 성공적으로 불러와졌습니다.");
    } catch {
      alert("❗ 유효하지 않은 JSON 파일입니다.");
    }
  };
  reader.readAsText(file);
}

function generateSuggestions() {
  const baseColor = document.getElementById("colorPicker").value.trim();
  const rgb = hexToRgb(baseColor);
  if (!rgb) {
    alert("❗ 유효하지 않은 HEX 색상입니다.");
    return;
  }

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  // 🎯 기본 추천 (보색 + 유사색)
  const comp = hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l);
  const analog1 = hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l);
  const analog2 = hslToHex((hsl.h + 330) % 360, hsl.s, hsl.l);

  const results = document.getElementById("results");
  results.innerHTML = `
    ${createSwatch(baseColor, "Base")}
    ${createSwatch(comp, "Complementary")}
    ${createSwatch(analog1, "Analogous 1")}
    ${createSwatch(analog2, "Analogous 2")}
  `;

  // 🌈 4단계 Gradient Suggestions (Lightness 조정)
  const l1 = Math.max(hsl.l - 0.3, 0);
  const l2 = Math.max(hsl.l - 0.1, 0);
  const l3 = Math.min(hsl.l + 0.1, 1);
  const l4 = Math.min(hsl.l + 0.3, 1);

  const g1 = hslToHex(hsl.h, hsl.s, l1);
  const g2 = hslToHex(hsl.h, hsl.s, l2);
  const g3 = hslToHex(hsl.h, hsl.s, l3);
  const g4 = hslToHex(hsl.h, hsl.s, l4);

  const gradientResults = document.getElementById("gradientResults");
  gradientResults.innerHTML = `
    ${createSwatch(g1, "Darker")}
    ${createSwatch(g2, "Dark")}
    ${createSwatch(g3, "Light")}
    ${createSwatch(g4, "Lighter")}
  `;

  // 🔺 Harmonic Set (Triadic & Tetradic)
  const triadic1 = hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l);
  const triadic2 = hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l);
  const tetradic1 = hslToHex((hsl.h + 90) % 360, hsl.s, hsl.l);
  const tetradic2 = hslToHex((hsl.h + 270) % 360, hsl.s, hsl.l);

  const harmonicResults = document.getElementById("harmonicResults");
  harmonicResults.innerHTML = `
    ${createSwatch(baseColor, "Base")}
    ${createSwatch(triadic1, "Triadic 1")}
    ${createSwatch(triadic2, "Triadic 2")}
    ${createSwatch(tetradic1, "Tetradic 1")}
    ${createSwatch(tetradic2, "Tetradic 2")}
  `;
}

function createSwatch(color, label) {
  return `
    <div class="color-swatch">
      <div class="swatch-color" style="background:${color}"></div>
      <div>${label}<br><strong>${color.toUpperCase()}</strong></div>
    </div>
  `;
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s, l };
}

function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r, g, b;

  if (h < 60)      [r, g, b] = [c, x, 0];
  else if (h < 120)[r, g, b] = [x, c, 0];
  else if (h < 180)[r, g, b] = [0, c, x];
  else if (h < 240)[r, g, b] = [0, x, c];
  else if (h < 300)[r, g, b] = [x, 0, c];
  else             [r, g, b] = [c, 0, x];

  return "#" + [r, g, b].map(v => Math.round((v + m) * 255)
    .toString(16).padStart(2, "0")).join("");
}

window.addEventListener("load", () => {
  resetColors();
  updateTargetBox();
  renderSavedMixes();
});

