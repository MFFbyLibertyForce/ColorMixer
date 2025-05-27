const targetColorInput = document.getElementById("targetColor");
const targetBox = document.getElementById("targetBox");
const targetText = document.getElementById("targetText");
const resultBox = document.getElementById("resultBox");
const resultText = document.getElementById("resultText");
const similarityText = document.getElementById("similarityText");
const ratioList = document.getElementById("ratioList");
const modal = document.getElementById("colorPickerModal");
const colorInput = document.getElementById("colorInput");
const colorPreview = document.getElementById("colorPreview");

let circles = [];
let editingIndex = -1;
let previousMode = document.querySelector('input[name="mode"]:checked').value;

const DEFAULT_COLORS = [
  { r: 255, g: 0, b: 0, type: "rgb" },
  { r: 0, g: 255, b: 0, type: "rgb" },
  { r: 0, g: 0, b: 255, type: "rgb" },
  { r: 0, g: 255, b: 255, type: "cmy" },
  { r: 255, g: 0, b: 255, type: "cmy" },
  { r: 255, g: 255, b: 0, type: "cmy" },
  { r: 255, g: 255, b: 255, type: "wb" },
  { r: 0, g: 0, b: 0, type: "wb" }
];

function hexToRgb(hex) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function rgbToHex({ r = 0, g = 0, b = 0 } = {}) {
  return (
    "#" +
    [r, g, b].map((x) => parseInt(x).toString(16).padStart(2, "0")).join("")
  );
}

function parseColor(str) {
  if (/^#[0-9a-fA-F]{6}$/.test(str)) return hexToRgb(str);
  if (/^[\d\s]*,[\d\s]*,[\d\s]*$/.test(str)) {
    const parts = str.split(",").map((x) => parseInt(x.trim()));
    if (parts.length === 3 && parts.every((x) => x >= 0 && x <= 255)) {
      return { r: parts[0], g: parts[1], b: parts[2] };
    }
  }
  return null;
}

function updateTargetBox() {
  const value = targetColorInput.value.trim();
  const rgb = parseColor(value);
  if (rgb) {
    const hex = rgbToHex(rgb);
    targetBox.style.background = hex;
    targetText.textContent = `Target: ${hex.toUpperCase()}`;
  }
}

targetColorInput.addEventListener("input", updateTargetBox);

function openModal(index) {
  editingIndex = index;
  colorInput.value = rgbToHex(circles[index].color);
  colorPreview.value = rgbToHex(circles[index].color);
  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
  editingIndex = -1;
}

function applyColor() {
  const str = colorInput.value.trim();
  const rgb = parseColor(str);
  if (!rgb) {
    alert("❗ HEX (#ffffff) 또는 RGB (255,255,255) 형식으로 입력해주세요.");
    return;
  }
  circles[editingIndex].color = rgb;
  render();
  closeModal();
}

function addColorCircle() {
  const customCount = circles.filter(c => c.type === "custom").length;
  if (customCount >= 10) {
    alert("❗ Custom 색상은 최대 10개까지 추가할 수 있습니다.");
    return;
  }
  circles.push({ color: { r: 136, g: 136, b: 136 }, weight: 0, type: "custom" });
  render();
}

function resetColors() {
  const presets = DEFAULT_COLORS.map(c => ({ color: { ...c }, weight: 0, type: c.type }));
  const customs = circles.filter(c => c.type === "custom").map(c => ({ ...c, weight: 0 }));
  circles = [...presets, ...customs];
  render();
}

function render() {
  const groupRGB = document.getElementById("group-rgb");
  const groupCMY = document.getElementById("group-cmy");
  const groupWB = document.getElementById("group-wb");
  const groupCustom = document.getElementById("group-custom");

  groupRGB.innerHTML = "";
  groupCMY.innerHTML = "";
  groupWB.innerHTML = "";
  groupCustom.innerHTML = "";

  circles.forEach((item, i) => {
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
    else groupCustom.appendChild(wrap);
  });

  updateMix();
}

function updateMix() {
  let r = 0, g = 0, b = 0, total = 0;
  circles.forEach(({ color, weight }) => {
    r += color.r * weight;
    g += color.g * weight;
    b += color.b * weight;
    total += weight;
  });

  if (total === 0) {
    resultBox.style.background = "#000000";
    resultText.innerHTML = `#000000<br>RGB(0, 0, 0)<br><em>Unknown</em>`;
    similarityText.textContent = `유사도: -`;
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
  resultText.innerHTML = `${hex.toUpperCase()}<br>RGB(${Math.round(avg.r)}, ${Math.round(avg.g)}, ${Math.round(avg.b)})<br><em>색상 이름 불러오는 중...</em>`;

  fetchColorNameFromAPI(hex).then(name => {
    resultText.innerHTML = `${hex.toUpperCase()}<br>RGB(${Math.round(avg.r)}, ${Math.round(avg.g)}, ${Math.round(avg.b)})<br><em>${name}</em>`;
  });

  const target = parseColor(targetColorInput.value.trim());
  if (target) {
    const maxDist = Math.sqrt(255 ** 2 * 3);
    const dist = Math.sqrt(
      (avg.r - target.r) ** 2 +
      (avg.g - target.g) ** 2 +
      (avg.b - target.b) ** 2
    );
    const similarity = Math.round(100 - (dist / maxDist) * 100);
    similarityText.textContent = `유사도: ${similarity}%`;
  } else {
    similarityText.textContent = "유사도: -";
  }

  const lines = circles
  .map(({ color, weight }) => ({ hex: rgbToHex(color), weight }))
  .filter((c) => c.weight > 0);

const totalW = lines.reduce((a, b) => a + b.weight, 0);
const stepValue = parseInt(document.querySelector('input[name="step"]:checked').value);

ratioList.innerHTML =
  "<strong>혼합 비율:</strong><br>" +
  lines
    .map((c) => {
      const percent = Math.round((c.weight / totalW) * 100);
      const quotient = Math.floor(percent / stepValue);
      return `<span style="color:${c.hex}">${c.hex}</span>: ${percent}% → Step ${stepValue} → ${quotient}`;
    })
    .join("<br>");
}

async function fetchColorNameFromAPI(hex) {
  const cleanHex = hex.replace("#", "");
  try {
    const res = await fetch(`https://www.thecolorapi.com/id?hex=${cleanHex}`);
    const data = await res.json();
    return data.name.value || "Unknown";
  } catch (e) {
    return "Unknown";
  }
}

function findBestMix() {
  const step = parseInt(document.querySelector('input[name="step"]:checked').value);
  const currentMode = document.querySelector('input[name="mode"]:checked').value;
  const target = parseColor(targetColorInput.value.trim());

  if (!target) {
    alert("❗ 유효한 HEX 또는 RGB 색상코드를 입력해주세요.");
    return;
  }

  if (currentMode !== previousMode) {
    circles.forEach((c) => c.weight = 0);
    previousMode = currentMode;
  }

  const useInMode = (c) => {
    if (currentMode === "rgb") return c.type === "rgb" || c.type === "wb";
    if (currentMode === "hsv") return c.type === "cmy" || c.type === "wb";
    if (currentMode === "none") return c.type === "wb" || c.type === "custom";
    return true;
  };

  const mixPool = circles.filter(useInMode);
  if (!mixPool.length) {
    alert("❗ 해당 모드에서 사용할 수 있는 색상이 없습니다.");
    return;
  }

  const beamWidth = 20;
  const totalSteps = 100;

  let queue = [
    {
      weights: Array(mixPool.length).fill(0),
      r: 0,
      g: 0,
      b: 0,
      total: 0
    }
  ];

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
          dist: dist
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
    if (useInMode(circles[i])) {
      circles[i].weight = best.weights[j++];
    } else {
      circles[i].weight = 0;
    }
  }

  render();
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

    const colorPreview = document.createElement("div");
    colorPreview.className = "mix-preview";
    colorPreview.style.background = rgbToHex(item.mixed);

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
    loadBtn.title = "불러오기";
    loadBtn.onclick = () => {
      targetColorInput.value = rgbToHex(item.target);
      circles = item.mix.map(c => ({ ...c }));
      render();
      updateTargetBox();
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑";
    deleteBtn.title = "삭제";
    deleteBtn.onclick = () => {
      if (confirm("이 조합을 삭제하시겠습니까?")) {
        stored.splice(index, 1);
        localStorage.setItem("savedMixes", JSON.stringify(stored));
        renderSavedMixes();
      }
    };

    div.appendChild(colorPreview);
    div.appendChild(nameInput);
    div.appendChild(loadBtn);
    div.appendChild(deleteBtn);
    list.appendChild(div);
  });
}

window.addEventListener("load", () => {
  resetColors();
  updateTargetBox();
  renderSavedMixes();
});
