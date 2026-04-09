import {
  dimensionMeta,
  questions,
  specialQuestions,
  TYPE_LIBRARY,
  NORMAL_TYPES,
  DIM_EXPLANATIONS,
  dimensionOrder,
  DRUNK_TRIGGER_QUESTION_ID
} from "./data.js";
import { getTypeHref, getTypeImage } from "./type-media.js";

const DEFAULT_TITLE = "SBTI 人格测试 | 免费在线测试你的抽象人格类型";

const state = {
  shuffledQuestions: [],
  answers: {},
  currentResult: null
};

const panels = {
  intro: document.getElementById("panel-intro"),
  test: document.getElementById("panel-test"),
  result: document.getElementById("panel-result")
};

const elements = {
  questionList: document.getElementById("questionList"),
  progressBar: document.getElementById("progressBar"),
  progressText: document.getElementById("progressText"),
  testHint: document.getElementById("testHint"),
  submitBtn: document.getElementById("submitBtn"),
  backToIntroBtn: document.getElementById("backToIntroBtn"),
  toTopBtn: document.getElementById("toTopBtn"),
  restartBtn: document.getElementById("restartBtn"),
  copyResultBtn: document.getElementById("copyResultBtn"),
  resultTypeLink: document.getElementById("resultTypeLink"),
  resultTypeImage: document.getElementById("resultTypeImage"),
  resultModeKicker: document.getElementById("resultModeKicker"),
  resultTypeName: document.getElementById("resultTypeName"),
  resultTypeSub: document.getElementById("resultTypeSub"),
  posterCaption: document.getElementById("posterCaption"),
  matchBadge: document.getElementById("matchBadge"),
  resultDesc: document.getElementById("resultDesc"),
  funNote: document.getElementById("funNote"),
  rankedList: document.getElementById("rankedList"),
  secondaryTypeBox: document.getElementById("secondaryTypeBox"),
  dimList: document.getElementById("dimList"),
  copyStatus: document.getElementById("copyStatus")
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showPanel(name) {
  Object.entries(panels).forEach(([key, panel]) => {
    panel.hidden = key !== name;
  });

  const target = panels[name];
  if (!target) {
    return;
  }

  requestAnimationFrame(() => {
    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

function shuffle(array) {
  const list = [...array];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const next = Math.floor(Math.random() * (index + 1));
    [list[index], list[next]] = [list[next], list[index]];
  }
  return list;
}

function getVisibleQuestions() {
  const visible = [...state.shuffledQuestions];
  const gateIndex = visible.findIndex((question) => question.id === "drink_gate_q1");

  if (gateIndex !== -1 && state.answers.drink_gate_q1 === 3) {
    visible.splice(gateIndex + 1, 0, specialQuestions[1]);
  }

  return visible;
}

function getQuestionMetaLabel(question) {
  if (question.special) {
    return "补充题";
  }

  return "维度保密中";
}

function renderQuestions() {
  const visibleQuestions = getVisibleQuestions();

  elements.questionList.innerHTML = visibleQuestions
    .map((question, index) => {
      const options = question.options
        .map((option, optionIndex) => {
          const code = ["A", "B", "C", "D"][optionIndex] || String(optionIndex + 1);
          const checked = state.answers[question.id] === option.value ? "checked" : "";

          return `
            <label class="option">
              <input type="radio" name="${escapeHtml(question.id)}" value="${option.value}" ${checked}>
              <span class="option-body">
                <span class="option-code">${code}</span>
                <span>${escapeHtml(option.label)}</span>
              </span>
            </label>
          `;
        })
        .join("");

      return `
        <article class="question-card">
          <div class="question-meta">
            <span class="question-index">第 ${index + 1} 题</span>
            <span>${escapeHtml(getQuestionMetaLabel(question))}</span>
          </div>
          <h4 class="question-title">${escapeHtml(question.text)}</h4>
          <div class="option-grid">${options}</div>
        </article>
      `;
    })
    .join("");

  updateProgress();
}

function updateProgress() {
  const visibleQuestions = getVisibleQuestions();
  const total = visibleQuestions.length;
  const done = visibleQuestions.filter((question) => state.answers[question.id] !== undefined).length;
  const percent = total ? (done / total) * 100 : 0;
  const complete = total > 0 && done === total;

  elements.progressBar.style.width = `${percent}%`;
  elements.progressBar.setAttribute("role", "progressbar");
  elements.progressBar.setAttribute("aria-valuemin", "0");
  elements.progressBar.setAttribute("aria-valuemax", String(total));
  elements.progressBar.setAttribute("aria-valuenow", String(done));
  elements.progressText.textContent = `${done} / ${total}`;
  elements.submitBtn.disabled = !complete;
  elements.testHint.textContent = complete
    ? "都做完了。现在可以把你的电子魂魄交给结果页审判。"
    : "全选完才会放行。世界已经够乱了，起码把题做完整。";
}

function sumToLevel(score) {
  if (score <= 3) {
    return "L";
  }

  if (score === 4) {
    return "M";
  }

  return "H";
}

function levelNum(level) {
  return { L: 1, M: 2, H: 3 }[level];
}

function parsePattern(pattern) {
  return pattern.replaceAll("-", "").split("");
}

function getDrunkTriggered() {
  return state.answers[DRUNK_TRIGGER_QUESTION_ID] === 2;
}

function computeResult() {
  const rawScores = Object.fromEntries(dimensionOrder.map((dimension) => [dimension, 0]));

  questions.forEach((question) => {
    rawScores[question.dim] += Number(state.answers[question.id] || 0);
  });

  const levels = Object.fromEntries(
    dimensionOrder.map((dimension) => [dimension, sumToLevel(rawScores[dimension])])
  );

  const userVector = dimensionOrder.map((dimension) => levelNum(levels[dimension]));

  const ranked = NORMAL_TYPES
    .map((type) => {
      const vector = parsePattern(type.pattern).map(levelNum);
      let distance = 0;
      let exact = 0;

      for (let index = 0; index < vector.length; index += 1) {
        const diff = Math.abs(userVector[index] - vector[index]);
        distance += diff;

        if (diff === 0) {
          exact += 1;
        }
      }

      const similarity = Math.max(0, Math.round((1 - distance / 30) * 100));

      return {
        ...type,
        ...TYPE_LIBRARY[type.code],
        distance,
        exact,
        similarity
      };
    })
    .sort((left, right) => {
      if (left.distance !== right.distance) {
        return left.distance - right.distance;
      }

      if (left.exact !== right.exact) {
        return right.exact - left.exact;
      }

      return right.similarity - left.similarity;
    });

  const bestNormal = ranked[0];
  const drunkTriggered = getDrunkTriggered();

  let finalType;
  let modeKicker = "你的主类型";
  let badge = `匹配度 ${bestNormal.similarity}% · 精准命中 ${bestNormal.exact}/15 维`;
  let sub = "维度命中度较高，当前结果可视为你的第一人格画像。";
  let special = false;
  let secondaryType = null;

  if (drunkTriggered) {
    finalType = TYPE_LIBRARY.DRUNK;
    secondaryType = bestNormal;
    modeKicker = "隐藏人格已激活";
    badge = "匹配度 100% · 酒精异常因子已接管";
    sub = "乙醇亲和性过强，系统已直接跳过常规人格审判。";
    special = true;
  } else if (bestNormal.similarity < 60) {
    finalType = TYPE_LIBRARY.HHHH;
    modeKicker = "系统强制兜底";
    badge = `标准人格库最高匹配仅 ${bestNormal.similarity}%`;
    sub = "标准人格库对你的脑回路集体罢工了，于是系统把你强制分配给了 HHHH。";
    special = true;
  } else {
    finalType = bestNormal;
  }

  return {
    rawScores,
    levels,
    ranked,
    bestNormal,
    finalType,
    modeKicker,
    badge,
    sub,
    special,
    secondaryType,
    signature: dimensionOrder.map((dimension) => levels[dimension]).join("")
  };
}

function renderRankedList(result) {
  elements.rankedList.innerHTML = result.ranked
    .slice(0, 3)
    .map((type, index) => {
      const label = `${type.code}（${type.cn}）`;
      const meta = `距离 ${type.distance} · 精准命中 ${type.exact}/15`;

      return `
        <li>
          <div>
            <div class="ranked-label">${index + 1}. ${escapeHtml(label)}</div>
            <div class="ranked-meta">${escapeHtml(meta)}</div>
          </div>
          <div class="ranked-score">${type.similarity}%</div>
        </li>
      `;
    })
    .join("");
}

function renderSecondaryType(result) {
  if (!result.secondaryType) {
    elements.secondaryTypeBox.hidden = true;
    elements.secondaryTypeBox.textContent = "";
    return;
  }

  const secondary = result.secondaryType;
  elements.secondaryTypeBox.hidden = false;
  elements.secondaryTypeBox.textContent =
    `常规人格参考：${secondary.code}（${secondary.cn}），匹配度 ${secondary.similarity}% 。` +
    "隐藏分支或兜底规则覆盖了常规结果。";
}

function renderDimList(result) {
  elements.dimList.innerHTML = dimensionOrder
    .map((dimension) => {
      const level = result.levels[dimension];
      const explanation = DIM_EXPLANATIONS[dimension][level];

      return `
        <article class="dim-item">
          <div class="dim-item-top">
            <div class="dim-item-name">${escapeHtml(dimensionMeta[dimension].name)}</div>
            <div class="dim-item-score">${level} / ${result.rawScores[dimension]}分</div>
          </div>
          <p>${escapeHtml(explanation)}</p>
        </article>
      `;
    })
    .join("");
}

function renderResult() {
  const result = computeResult();
  const type = result.finalType;

  state.currentResult = result;

  elements.resultModeKicker.textContent = result.modeKicker;
  elements.resultTypeName.textContent = `${type.code}（${type.cn}）`;
  elements.resultTypeSub.textContent = result.sub;
  elements.resultTypeLink.href = getTypeHref(type.code);
  elements.posterCaption.textContent = type.intro;
  elements.matchBadge.textContent = `${result.badge} · 维度向量 ${result.signature}`;
  elements.resultDesc.textContent = type.desc;
  elements.resultTypeImage.src = getTypeImage(type.code);
  elements.resultTypeImage.alt = `${type.code}（${type.cn}）人格配图`;
  elements.funNote.textContent = result.special
    ? "本测试仅供娱乐。隐藏人格和 HHHH 兜底都属于系统故意埋的特殊分支，请勿把它当成医学、心理学、相学或命理学依据。"
    : "本测试仅供娱乐，别把它当成诊断、面试、相亲、分手、算命或人生判决书。";
  elements.copyStatus.textContent = "";

  renderRankedList(result);
  renderSecondaryType(result);
  renderDimList(result);

  document.title = `${type.code}（${type.cn}） | SBTI 人格测试`;
  showPanel("result");
}

function buildCopyText(result) {
  const type = result.finalType;
  const lines = [
    `我在 sbti.how 测出了 ${type.code}（${type.cn}）`,
    result.badge,
    type.intro,
    result.sub,
    `维度向量：${result.signature}`,
    "https://sbti.how/"
  ];

  if (result.secondaryType) {
    lines.splice(
      4,
      0,
      `常规人格参考：${result.secondaryType.code}（${result.secondaryType.cn}），匹配度 ${result.secondaryType.similarity}%`
    );
  }

  return lines.join("\n");
}

async function copyResultSummary() {
  if (!state.currentResult) {
    return;
  }

  const content = buildCopyText(state.currentResult);

  if (!navigator.clipboard?.writeText) {
    elements.copyStatus.textContent = "当前浏览器不支持一键复制，请手动复制结果。";
    return;
  }

  try {
    await navigator.clipboard.writeText(content);
    elements.copyStatus.textContent = "结果摘要已复制。";
  } catch (error) {
    elements.copyStatus.textContent = "复制失败，请检查浏览器权限后重试。";
  }
}

function startTest() {
  state.answers = {};
  state.currentResult = null;

  const shuffledRegular = shuffle(questions);
  const insertIndex = Math.floor(Math.random() * shuffledRegular.length) + 1;

  state.shuffledQuestions = [
    ...shuffledRegular.slice(0, insertIndex),
    specialQuestions[0],
    ...shuffledRegular.slice(insertIndex)
  ];

  document.title = DEFAULT_TITLE;
  elements.copyStatus.textContent = "";
  renderQuestions();
  showPanel("test");
}

function handleQuestionChange(event) {
  const input = event.target.closest('input[type="radio"]');
  if (!input) {
    return;
  }

  state.answers[input.name] = Number(input.value);

  if (input.name === "drink_gate_q1") {
    if (Number(input.value) !== 3) {
      delete state.answers[DRUNK_TRIGGER_QUESTION_ID];
    }

    renderQuestions();
    return;
  }

  updateProgress();
}

function bindEvents() {
  document.querySelectorAll("[data-start-test]").forEach((button) => {
    button.addEventListener("click", startTest);
  });

  elements.questionList.addEventListener("change", handleQuestionChange);
  elements.submitBtn.addEventListener("click", renderResult);
  elements.backToIntroBtn.addEventListener("click", () => showPanel("intro"));
  elements.toTopBtn?.addEventListener("click", () => showPanel("intro"));
  elements.restartBtn.addEventListener("click", startTest);
  elements.copyResultBtn.addEventListener("click", copyResultSummary);
}

bindEvents();
