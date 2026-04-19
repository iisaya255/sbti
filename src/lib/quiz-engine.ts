// Generic quiz calculation engine
// Extracted from the original SBTI app.js and generalized

export interface QuizDimension {
  code: string;
  name: string;
}

export interface QuizOption {
  label: string;
  value: number;
}

export interface QuizQuestion {
  id: string;
  dimCode: string;
  text: string;
  options: QuizOption[];
  special?: boolean;
}

export interface PersonalityType {
  code: string;
  name: string;
  description: string;
  intro: string;
  imageUrl: string;
  dimPattern: Record<string, "L" | "M" | "H">;
}

export interface RankedType extends PersonalityType {
  distance: number;
  exact: number;
  similarity: number;
}

export interface QuizResult {
  rawScores: Record<string, number>;
  levels: Record<string, "L" | "M" | "H">;
  ranked: RankedType[];
  bestMatch: RankedType;
  signature: string;
}

export function sumToLevel(score: number): "L" | "M" | "H" {
  if (score <= 3) return "L";
  if (score === 4) return "M";
  return "H";
}

function levelNum(level: string): number {
  return { L: 1, M: 2, H: 3 }[level] ?? 2;
}

export function computeScores(
  questions: QuizQuestion[],
  answers: Record<string, number>,
  dimensionCodes: string[]
): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const code of dimensionCodes) {
    scores[code] = 0;
  }
  for (const q of questions) {
    if (q.special) continue;
    scores[q.dimCode] = (scores[q.dimCode] ?? 0) + (answers[q.id] ?? 0);
  }
  return scores;
}

export function computeLevels(
  scores: Record<string, number>
): Record<string, "L" | "M" | "H"> {
  const levels: Record<string, "L" | "M" | "H"> = {};
  for (const [dim, score] of Object.entries(scores)) {
    levels[dim] = sumToLevel(score);
  }
  return levels;
}

export function matchTypes(
  levels: Record<string, "L" | "M" | "H">,
  types: PersonalityType[],
  dimensionOrder: string[]
): RankedType[] {
  const userVector = dimensionOrder.map((d) => levelNum(levels[d]));

  return types
    .map((type) => {
      const typeVector = dimensionOrder.map((d) =>
        levelNum(type.dimPattern[d] ?? "M")
      );
      let distance = 0;
      let exact = 0;

      for (let i = 0; i < typeVector.length; i++) {
        const diff = Math.abs(userVector[i] - typeVector[i]);
        distance += diff;
        if (diff === 0) exact++;
      }

      const maxDistance = dimensionOrder.length * 2;
      const similarity = Math.max(
        0,
        Math.round((1 - distance / maxDistance) * 100)
      );

      return { ...type, distance, exact, similarity };
    })
    .sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      if (a.exact !== b.exact) return b.exact - a.exact;
      return b.similarity - a.similarity;
    });
}

export function computeQuizResult(
  questions: QuizQuestion[],
  answers: Record<string, number>,
  dimensionOrder: string[],
  types: PersonalityType[]
): QuizResult {
  const rawScores = computeScores(questions, answers, dimensionOrder);
  const levels = computeLevels(rawScores);
  const ranked = matchTypes(levels, types, dimensionOrder);
  const bestMatch = ranked[0];
  const signature = dimensionOrder.map((d) => levels[d]).join("");

  return { rawScores, levels, ranked, bestMatch, signature };
}
