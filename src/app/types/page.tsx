import Image from "next/image";
import {
  RESULT_TYPE_CODES,
  allTypes,
  normalTypes,
  getTypeSlug,
  getTypeImage,
  getTypeHref,
} from "@/data/sbti";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "27种人格类型一览",
  description: "SBTI 全部 27 种人格类型总览，包含标准人格、隐藏人格和系统兜底人格。",
};

const normalSet = new Set(normalTypes.map((t) => t.code));

function getTypeMode(code: string): string {
  if (code === "DRUNK") return "隐藏人格";
  if (code === "HHHH") return "系统兜底人格";
  if (normalSet.has(code)) return "标准人格";
  return "特殊人格";
}

export default function TypesPage() {
  const entries = RESULT_TYPE_CODES.map((code) => allTypes[code]).filter(Boolean);

  return (
    <>
      <section className="section">
        <div className="section-heading">
          <p className="section-kicker">全部人格</p>
          <h2>27 种人格类型一览</h2>
          <p>包含 25 种标准人格、1 种隐藏人格和 1 种系统兜底人格。</p>
        </div>
        <div className="types-grid-page">
          {entries.map((type) => (
            <a className="type-card" href={`#${getTypeSlug(type.code)}`} key={type.code}>
              <div className="type-card-image">
                <img src={getTypeImage(type.code)} alt={`${type.code} 人格配图`} width={96} height={96} loading="lazy" />
              </div>
              <div>
                <span className="type-card-code">{type.code}</span>
                <span className="type-card-name">{type.name}</span>
                <p className="type-card-intro">{type.intro}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="type-detail-list">
          {entries.map((type) => (
            <article className="type-detail-card card" id={getTypeSlug(type.code)} key={type.code}>
              <div className="type-detail-grid">
                <figure className="type-detail-visual">
                  <img src={getTypeImage(type.code)} alt={`${type.code}（${type.name}）人格配图`} width={320} height={320} loading="lazy" />
                </figure>
                <div>
                  <div className="type-header">
                    <div>
                      <h2 className="type-title">{type.code}（{type.name}）</h2>
                      <div className="type-tags">
                        <span className="type-tag">{getTypeMode(type.code)}</span>
                        <a className="type-tag" href="/">去测这个结果</a>
                      </div>
                    </div>
                  </div>
                  <p className="type-intro">{type.intro}</p>
                  <p className="type-desc">{type.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
