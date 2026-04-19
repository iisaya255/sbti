export type Profile = {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
};

export type QuizStatus = "draft" | "published";

export type Quiz = {
  id: string;
  author_id: string;
  slug: string;
  title: string;
  description: string | null;
  og_image: string | null;
  status: QuizStatus;
  created_at: string;
  published_at: string | null;
};

export type Dimension = {
  id: string;
  quiz_id: string;
  code: string;
  name: string;
  sort_order: number;
};

export type Question = {
  id: string;
  quiz_id: string;
  dimension_id: string;
  text: string;
  sort_order: number;
};

export type QuizOption = {
  id: string;
  question_id: string;
  text: string;
  score: number;
};

export type PersonalityTypeRow = {
  id: string;
  quiz_id: string;
  code: string;
  name: string;
  description: string | null;
  image_url: string | null;
  dim_pattern: Record<string, string>;
};

export type Submission = {
  id: string;
  quiz_id: string;
  result_type: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & Pick<Profile, "id">; Update: Partial<Profile> };
      quizzes: { Row: Quiz; Insert: Omit<Quiz, "id" | "created_at" | "published_at" | "status"> & Partial<Pick<Quiz, "id" | "status">>; Update: Partial<Quiz> };
      dimensions: { Row: Dimension; Insert: Omit<Dimension, "id"> & Partial<Pick<Dimension, "id">>; Update: Partial<Dimension> };
      questions: { Row: Question; Insert: Omit<Question, "id"> & Partial<Pick<Question, "id">>; Update: Partial<Question> };
      options: { Row: QuizOption; Insert: Omit<QuizOption, "id"> & Partial<Pick<QuizOption, "id">>; Update: Partial<QuizOption> };
      personality_types: { Row: PersonalityTypeRow; Insert: Omit<PersonalityTypeRow, "id"> & Partial<Pick<PersonalityTypeRow, "id">>; Update: Partial<PersonalityTypeRow> };
      submissions: { Row: Submission; Insert: Omit<Submission, "id" | "created_at"> & Partial<Pick<Submission, "id">>; Update: Partial<Submission> };
    };
  };
};
