const colorCircles = document.getElementById("color-circles");
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

function rgbToHex({ r, g, b }) {
  return (
    "#" +
    [r, g, b]
      .map((x) => parseInt(x).toString(16).padStart(2, "0"))
      .join("")
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
  if (circles.length >= 10) return;
  circles.push({ color: { r: 136, g: 136, b: 136 }, weight: 0, type: "custom" });
  render();
}

function resetColors() {
  circles = [];
  DEFAULT_COLORS.forEach((color) => {
    circles.push({ color, weight: 0, type: color.type });
  });
  render();
}

function render() {
  colorCircles.innerHTML = "";
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
    colorCircles.appendChild(wrap);
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
    resultText.innerHTML = `#000000<br>RGB(0, 0, 0)`;
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
  resultText.innerHTML = `${hex.toUpperCase()}<br>RGB(${Math.round(avg.r)}, ${Math.round(avg.g)}, ${Math.round(avg.b)})`;

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
  ratioList.innerHTML =
    "<strong>혼합 비율:</strong><br>" +
    lines
      .map(
        (c) =>
          `<span style="color:${c.hex}">${c.hex}</span>: ${Math.round(
            (c.weight / totalW) * 100
          )}%`
      )
      .join("<br>");
}

function findBestMix() {
  const step = parseInt(document.querySelector('input[name="step"]:checked').value);
  const currentMode = document.querySelector('input[name="mode"]:checked').value;
  const target = parseColor(targetColorInput.value.trim());

  if (!target) {
    alert("❗ 유효한 HEX 또는 RGB 색상코드를 입력해주세요 (예: #ffcc00 또는 255,255,255)");
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

  const weights = Array(mixPool.length).fill(0);
  let bestMix = null;
  let bestScore = Infinity;
  let bestColor = null;

  function dfs(i, left) {
    if (i === weights.length - 1) {
      weights[i] = left;
      testMix(weights);
      return;
    }
    for (let w = 0; w <= left; w += step) {
      weights[i] = w;
      dfs(i + 1, left - w);
    }
  }

  function testMix(w) {
    let r = 0, g = 0, b = 0, total = 0;
    for (let i = 0; i < w.length; i++) {
      r += mixPool[i].color.r * w[i];
      g += mixPool[i].color.g * w[i];
      b += mixPool[i].color.b * w[i];
      total += w[i];
    }
    if (total === 0) return;
    const avg = { r: r / total, g: g / total, b: b / total };
    const dist = Math.sqrt(
      (avg.r - target.r) ** 2 +
      (avg.g - target.g) ** 2 +
      (avg.b - target.b) ** 2
    );
    if (dist < bestScore) {
      bestScore = dist;
      bestMix = [...w];
      bestColor = avg;
    }
  }

  dfs(0, 100);

  if (!bestMix) {
    alert("❗ 최적 조합을 찾을 수 없습니다.");
    return;
  }

  let j = 0;
  for (let i = 0; i < circles.length; i++) {
    if (useInMode(circles[i])) {
      circles[i].weight = bestMix[j++];
    } else {
      circles[i].weight = 0;
    }
  }

  render();

  const hex = rgbToHex({
    r: Math.round(bestColor.r),
    g: Math.round(bestColor.g),
    b: Math.round(bestColor.b)
  }).toUpperCase();
  resultBox.style.background = hex;
  resultText.innerHTML = `${hex}<br>RGB(${Math.round(bestColor.r)}, ${Math.round(bestColor.g)}, ${Math.round(bestColor.b)})`;

  const maxDist = Math.sqrt(255 ** 2 * 3);
  const similarity = Math.round(100 - (bestScore / maxDist) * 100);
  similarityText.textContent = `유사도: ${similarity}%`;

  const lines = bestMix.map((w, i) => {
    const label = `${step} × ${w / step}`;
    const colorHex = rgbToHex(mixPool[i].color);
    return `<span style="color:${colorHex}">${colorHex}</span>: ${label}`;
  }).join("<br>");
  ratioList.innerHTML = "<strong>혼합 비율:</strong><br>" + lines;
}

window.addEventListener("load", () => {
  resetColors();
  updateTargetBox();
});