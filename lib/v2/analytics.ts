import { supabaseAdmin } from '@/lib/supabaseAdminClient';

export type V2ActivityPoint = {
  day: string;
  starts: number;
  completed: number;
};

export type V2Analytics = {
  starts: number;
  completed: number;
  completion_rate: number;
  known_languages: {
    en: number;
    es: number;
  };
  winner_distribution: Partial<Record<'red' | 'blue' | 'yellow' | 'green', number>>;
  known_result_count: number;
  primary_secondary: { primary: string; secondary: string; count: number }[];
  score_margins: { known: number; ties: number; average: number; minimum: number; maximum: number };
  corpus: {
    active_questions: number;
    active_likert: number;
    active_single: number;
  };
  activity_30d: V2ActivityPoint[];
};

function assertNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid analytics field: ${field}`);
  }
  return value;
}

export async function getV2Analytics(): Promise<V2Analytics> {
  const { data, error } = await supabaseAdmin.rpc('v2_admin_analytics');
  if (error) throw new Error(`Unable to load V2 analytics: ${error.message}`);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('V2 analytics returned an invalid payload');
  }

  const payload = data as Record<string, unknown>;
  const languages = (payload.known_languages ?? {}) as Record<string, unknown>;
  const corpus = (payload.corpus ?? {}) as Record<string, unknown>;
  const winners = (payload.winner_distribution ?? {}) as Record<string, unknown>;
  const activity = Array.isArray(payload.activity_30d) ? payload.activity_30d : [];
  const combinations = Array.isArray(payload.primary_secondary) ? payload.primary_secondary : [];
  const margins = (payload.score_margins ?? {}) as Record<string, unknown>;

  return {
    starts: assertNumber(payload.starts, 'starts'),
    completed: assertNumber(payload.completed, 'completed'),
    completion_rate: assertNumber(payload.completion_rate, 'completion_rate'),
    known_languages: {
      en: assertNumber(languages.en ?? 0, 'known_languages.en'),
      es: assertNumber(languages.es ?? 0, 'known_languages.es'),
    },
    winner_distribution: {
      red: Number(winners.red ?? 0),
      blue: Number(winners.blue ?? 0),
      yellow: Number(winners.yellow ?? 0),
      green: Number(winners.green ?? 0),
    },
    known_result_count: assertNumber(payload.known_result_count ?? 0, 'known_result_count'),
    primary_secondary: combinations.map((row, index) => {
      const item = row as Record<string, unknown>;
      if (typeof item.primary !== 'string' || typeof item.secondary !== 'string') throw new Error(`Invalid analytics combination ${index}`);
      return { primary: item.primary, secondary: item.secondary, count: assertNumber(item.count, `primary_secondary[${index}].count`) };
    }),
    score_margins: {
      known: assertNumber(margins.known ?? 0, 'score_margins.known'),
      ties: assertNumber(margins.ties ?? 0, 'score_margins.ties'),
      average: assertNumber(margins.average ?? 0, 'score_margins.average'),
      minimum: assertNumber(margins.minimum ?? 0, 'score_margins.minimum'),
      maximum: assertNumber(margins.maximum ?? 0, 'score_margins.maximum'),
    },
    corpus: {
      active_questions: assertNumber(corpus.active_questions, 'corpus.active_questions'),
      active_likert: assertNumber(corpus.active_likert, 'corpus.active_likert'),
      active_single: assertNumber(corpus.active_single, 'corpus.active_single'),
    },
    activity_30d: activity.map((row, index) => {
      const item = row as Record<string, unknown>;
      if (typeof item.day !== 'string') throw new Error(`Invalid analytics field: activity_30d[${index}].day`);
      return {
        day: item.day,
        starts: assertNumber(item.starts, `activity_30d[${index}].starts`),
        completed: assertNumber(item.completed, `activity_30d[${index}].completed`),
      };
    }),
  };
}

export async function getCompletedAssessmentCount(): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc('v2_completed_assessment_count');
  if (error) throw new Error(`Unable to load completed assessment count: ${error.message}`);
  return assertNumber(data, 'completed_assessment_count');
}
