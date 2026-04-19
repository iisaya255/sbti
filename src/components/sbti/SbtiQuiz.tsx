"use client";

import { useState, useCallback } from "react";
import {
  questions,
  specialQuestions,
  dimensionOrder,
  dimensionMeta,
  normalTypes,
  specialTypes,
  allTypes,
  DIM_EXPLANATIONS,
  DRUNK_TRIGGER_QUESTION_ID,
  getTypeImage,
  getTypeHref,
} from "@/data/sbti";
import { computeQuizResult, type QuizResult, type PersonalityType } from "@/lib/quiz-engine";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function shuffle<T>(array: T[]): T[] {
  const list = [...array];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

type Panel = "intro" | "test" | "result";

export default function SbtiQuiz() {
  const [panel, setPanel] = useState<Panel>("intro");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [shuffledQuestions, setShuffledQuestions] = useState(questions);
  const [result, setResult] = useState<{
    quizResult: QuizResult;
    finalType: PersonalityType;
    modeKicker: string;
    badge: string;
    sub: string;
    special: boolean;
    secondaryType: PersonalityType | null;
  } | null>(null);
  const [copyStatus, setCopyStatus] = useState("");

  const startTest = useCallback(() => {
    setAnswers({});
    setResult(null);
    setCopyStatus("");
    const shuffled = shuffle(questions);
    const insertIndex = Math.floor(Math.random() * shuffled.length) + 1;
    setShuffledQuestions([
      ...shuffled.slice(0, insertIndex),
      specialQuestions[0],
      ...shuffled.slice(insertIndex),
    ]);
    setPanel("test");
  }, []);

  const getVisibleQuestions = useCallback(() => {
    const visible = [...shuffledQuestions];
    const gateIndex = visible.findIndex((q) => q.id === "drink_gate_q1");
    if (gateIndex !== -1 && answers.drink_gate_q1 === 3) {
      visible.splice(gateIndex + 1, 0, specialQuestions[1]);
    }
    return visible;
  }, [shuffledQuestions, answers]);

  const visibleQuestions = getVisibleQuestions();
  const totalQuestions = visibleQuestions.length;
  const answeredCount = visibleQuestions.filter((q) => answers[q.id] !== undefined).length;
  const progress = totalQuestions ? (answeredCount / totalQuestions) * 100 : 0;
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  const handleAnswer = useCallback((questionId: string, value: number) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      if (questionId === "drink_gate_q1" && value !== 3) {
        delete next[DRUNK_TRIGGER_QUESTION_ID];
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const quizResult = computeQuizResult(questions, answers, dimensionOrder, normalTypes);
    const drunkTriggered = answers[DRUNK_TRIGGER_QUESTION_ID] === 2;
    const best = quizResult.bestMatch;

    let finalType: PersonalityType;
    let modeKicker = "你的主类型";
    let badge = `匹配度 ${best.similarity}% · 精准命中 ${best.exact}/15 维`;
    let sub = "维度命中度较高，当前结果可视为你的第一人格画像。";
    let special = false;
    let secondaryType: PersonalityType | null = null;

    if (drunkTriggered) {
      finalType = specialTypes.DRUNK;
      secondaryType = best;
      modeKicker = "隐藏人格已激活";
      badge = "匹配度 100% · 酒精异常因子已接管";
      sub = "乙醇亲和性过强，系统已直接跳过常规人格审判。";
      special = true;
    } else if (best.similarity < 60) {
      finalType = specialTypes.HHHH;
      modeKicker = "系统强制兜底";
      badge = `标准人格库最高匹配仅 ${best.similarity}%`;
      sub = "标准人格库对你的脑回路集体罢工了，于是系统把你强制分配给了 HHHH。";
      special = true;
    } else {
      finalType = best;
    }

    setResult({ quizResult, finalType, modeKicker, badge, sub, special, secondaryType });
    setPanel("result");
  }, [answers]);

  const copyResult = useCallback(async () => {
    if (!result) return;
    const { finalType, badge, sub, quizResult, secondaryType } = result;
    const lines = [
      `我在 sbti.how 测出了 ${finalType.code}（${finalType.name}）`,
      badge,
      finalType.intro,
      sub,
      `维度向量：${quizResult.signature}`,
      "https://sbti.how/",
    ];
    if (secondaryType) {
      lines.splice(4, 0, `常规人格参考：${secondaryType.code}（${secondaryType.name}）`);
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyStatus("结果摘要已复制。");
    } catch {
      setCopyStatus("复制失败，请检查浏览器权限后重试。");
    }
  }, [result]);

  // ---- INTRO PANEL ----
  if (panel === "intro") {
    return (
      <section>
        <div className="hero card hero-minimal home-hero">
          <p className="eyebrow">sbti.how</p>
          <h1 className="hero-title-split">
            <span>MBTI已经过时</span>
            <span>SBTI来了</span>
          </h1>
          <div className="hero-actions hero-actions-single">
            <button className="button button-primary" onClick={startTest}>开始测试</button>
            <a className="button button-secondary" href="/types">人格类型</a>
          </div>
          <div className="source-meta">
            <span>原作者：B站 @蛆肉儿串儿</span>
          </div>
        </div>
        <details className="home-note card" id="faq">
          <summary>FAQ</summary>
          <div className="home-note-content">
            <div className="qa-item">
              <p className="qa-q">Q: SBTI 结果是怎么判定的？</p>
              <p className="qa-a">A: 15 个维度各由 2 道题组成，每个维度会根据总分换算为 L、M、H，再与标准人格库做距离匹配。</p>
            </div>
            <div className="qa-item">
              <p className="qa-q">Q: 测试数据会上传吗？</p>
              <p className="qa-a">A: 答题和结果计算都在浏览器本地完成。</p>
            </div>
            <div className="qa-item">
              <p className="qa-q">Q: SBTI 可以当成心理诊断吗？</p>
              <p className="qa-a">A: 不可以，它更适合娱乐和轻量自我观察。</p>
            </div>
          </div>
        </details>
      </section>
    );
  }

  // ---- TEST PANEL ----
  if (panel === "test") {
    return (
      <section>
        <div className="test-wrap card">
          <div className="topbar">
            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-text">{answeredCount} / {totalQuestions}</div>
          </div>
          <div className="question-list">
            {visibleQuestions.map((q, idx) => (
              <article className="question-card" key={q.id}>
                <div className="question-meta">
                  <span className="question-index">第 {idx + 1} 题</span>
                  <span>{q.special ? "补充题" : "维度保密中"}</span>
                </div>
                <h4 className="question-title">{q.text}</h4>
                <div className="option-grid">
                  {q.options.map((opt, oi) => {
                    const code = ["A", "B", "C", "D"][oi] ?? String(oi + 1);
                    return (
                      <label className="option" key={oi}>
                        <input
                          type="radio"
                          name={q.id}
                          value={opt.value}
                          checked={answers[q.id] === opt.value}
                          onChange={() => handleAnswer(q.id, opt.value)}
                        />
                        <span className="option-body">
                          <span className="option-code">{code}</span>
                          <span>{opt.label}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
          <div className="actions-bottom">
            <div className="hint">
              {allAnswered
                ? "都做完了。现在可以把你的电子魂魄交给结果页审判。"
                : "全选完才会放行。世界已经够乱了，起码把题做完整。"}
            </div>
            <div className="action-row">
              <button className="button button-secondary" onClick={() => setPanel("intro")}>返回首页</button>
              <button className="button button-primary" disabled={!allAnswered} onClick={handleSubmit}>提交并查看结果</button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ---- RESULT PANEL ----
  if (!result) return null;
  const { quizResult, finalType, modeKicker, badge, sub, special, secondaryType } = result;

  return (
    <section>
      <div className="result-wrap card">
        <div className="result-top">
          <div className="result-type-hero">
            <figure className="result-visual">
              <img src={getTypeImage(finalType.code)} alt={`${finalType.code}（${finalType.name}）人格配图`} width={320} height={320} />
            </figure>
            <div className="type-box">
              <p className="panel-kicker">{modeKicker}</p>
              <h2 className="type-title-main">{finalType.code}（{finalType.name}）</h2>
              <p className="match-badge">{badge} · 维度向量 {quizResult.signature}</p>
              <p className="result-sub">{sub}</p>
              <p className="poster-caption">{finalType.intro}</p>
            </div>
          </div>
          <div className="result-actions">
            <a className="button button-tertiary" href={getTypeHref(finalType.code)}>查看类型档案</a>
            <button className="button button-secondary" onClick={copyResult}>复制结果摘要</button>
            <button className="button button-primary" onClick={startTest}>重新测试</button>
          </div>
        </div>

        <div className="result-layout">
          <article className="result-card card">
            <p className="result-card-tag">该人格的简单解读</p>
            <p className="result-desc">{finalType.description}</p>
            <p className="fun-note">
              {special
                ? "本测试仅供娱乐。隐藏人格和 HHHH 兜底都属于系统故意埋的特殊分支，请勿把它当成医学、心理学、相学或命理学依据。"
                : "本测试仅供娱乐，别把它当成诊断、面试、相亲、分手、算命或人生判决书。"}
            </p>
            <p className="copy-status" role="status">{copyStatus}</p>
          </article>
          <aside className="result-side card">
            <h4>匹配度前 3</h4>
            <ol className="ranked-list">
              {quizResult.ranked.slice(0, 3).map((t, i) => (
                <li key={t.code}>
                  <div>
                    <div className="ranked-label">{i + 1}. {t.code}（{t.name}）</div>
                    <div className="ranked-meta">距离 {t.distance} · 精准命中 {t.exact}/15</div>
                  </div>
                  <div className="ranked-score">{t.similarity}%</div>
                </li>
              ))}
            </ol>
            {secondaryType && (
              <div className="secondary-note">
                常规人格参考：{secondaryType.code}（{secondaryType.name}），匹配度 {(secondaryType as any).similarity ?? "N/A"}%。隐藏分支或兜底规则覆盖了常规结果。
              </div>
            )}
          </aside>
        </div>

        <div className="section-heading compact">
          <p className="section-kicker">十五维度评分</p>
          <h4>15 个维度的得分解释</h4>
          <p>每个维度按总分映射成 L / M / H，结果页会给出对应的中文描述。</p>
        </div>
        <div className="dim-grid">
          {dimensionOrder.map((dim) => (
            <article className="dim-item" key={dim}>
              <div className="dim-item-top">
                <div className="dim-item-name">{dimensionMeta[dim].name}</div>
                <div className="dim-item-score">{quizResult.levels[dim]} / {quizResult.rawScores[dim]}分</div>
              </div>
              <p>{DIM_EXPLANATIONS[dim]?.[quizResult.levels[dim]] ?? ""}</p>
            </article>
          ))}
        </div>

        <details className="author-box">
          <summary>作者的话</summary>
          <div className="author-content">
            <p>本测试首发于 B 站 up 主蛆肉儿串儿，初衷是劝诫一位爱喝酒的朋友戒酒。</p>
            <p>由于这套测试本身偏娱乐和梗文化，所以部分人格名称和文案会比较抽象，别太当真。</p>
          </div>
        </details>

        <div className="result-actions footer-actions">
          <button className="button button-secondary" onClick={() => setPanel("intro")}>回到首页</button>
        </div>
      </div>
    </section>
  );
}
