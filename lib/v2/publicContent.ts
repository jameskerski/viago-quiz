import { SPANISH_RESULT_DESCRIPTIONS } from '@/lib/spanishResultDescriptions';

export type V2Color = 'red' | 'blue' | 'yellow' | 'green';
export type V2Lang = 'en' | 'es';

export const COLOR_ORDER: V2Color[] = ['red', 'blue', 'yellow', 'green'];

export const COLOR_META: Record<V2Color, { hex: string; name: Record<V2Lang, string>; role: Record<V2Lang, string> }> = {
  red: { hex: '#ff3d57', name: { en: 'Red', es: 'Rojo' }, role: { en: 'The Driver', es: 'La persona impulsora' } },
  blue: { hex: '#35a8ff', name: { en: 'Blue', es: 'Azul' }, role: { en: 'The Energizer', es: 'La persona dinamizadora' } },
  yellow: { hex: '#ffc928', name: { en: 'Yellow', es: 'Amarillo' }, role: { en: 'The Stabilizer', es: 'La persona estabilizadora' } },
  green: { hex: '#69d34d', name: { en: 'Green', es: 'Verde' }, role: { en: 'The Analyst', es: 'La persona analítica' } },
};

const english = {
  red: {
    narrative: 'You are fueled by progress, challenge, and visible outcomes. You decide quickly, take responsibility naturally, and create momentum when others hesitate.',
    strengths: ['Decisive under pressure', 'Highly driven', 'Comfortable with responsibility', 'Results-oriented'],
    challenges: ['Impatience with people', 'Listening after a decision is made', 'Appearing dismissive', 'Creating team friction'],
    guidance: 'Clear targets and standards bring out your best. Your biggest growth opportunity is developing other people without steamrolling them.',
  },
  blue: {
    narrative: 'You are driven by experience, connection, and stimulation. You bring energy into rooms and thrive when work includes people, variety, and freedom.',
    strengths: ['Socially magnetic', 'Adaptable', 'Creative', 'Relationship builder'],
    challenges: ['Following through on repetitive work', 'Time blindness', 'Impulsive decisions', 'Losing focus when novelty fades'],
    guidance: 'You create connection and momentum quickly. Simple structure helps you stay consistent after the initial excitement.',
  },
  yellow: {
    narrative: 'You are motivated by values, fairness, and relationships. You notice who needs support and help groups feel safe, stable, and connected.',
    strengths: ['Dependable and supportive', 'High integrity', 'Emotionally intuitive', 'Values-driven'],
    challenges: ['Avoiding conflict', 'Reluctance to lead', 'Enabling poor behavior', 'Burnout around aggressive personalities'],
    guidance: 'You build trust and long-term relationships. Growth accelerates when you choose direct conversations instead of quietly carrying the strain.',
  },
  green: {
    narrative: 'You seek clarity, logic, and predictability. You protect people and organizations from chaos by questioning assumptions and building thoughtful systems.',
    strengths: ['Thorough and precise', 'Excellent planner', 'Calm when logic is available', 'Risk-aware'],
    challenges: ['Analysis paralysis', 'Appearing cold or critical', 'Rigidity under pressure', 'Waiting for complete certainty'],
    guidance: 'You strengthen systems and improve training. Your growth edge is allowing informed action before every variable is fully certain.',
  },
} as const;

function spanishDefinition(color: V2Color) {
  const text = SPANISH_RESULT_DESCRIPTIONS[color].definition;
  const section = (name: string, next?: string) => {
    const start = text.indexOf(name);
    if (start < 0) return '';
    const from = start + name.length;
    const end = next ? text.indexOf(next, from) : -1;
    return text.slice(from, end < 0 ? undefined : end).trim();
  };
  const bullets = (name: string, next: string) => section(name, next).split('\n').map((line) => line.replace(/^•\s*/, '').trim()).filter(Boolean);
  return {
    narrative: section('IMPULSO CENTRAL', '¿CÓMO SE MANIFIESTAN?').replace(/\n+/g, ' '),
    strengths: bullets('FORTALEZAS', 'DEBILIDADES'),
    challenges: bullets('DEBILIDADES', 'EJEMPLO EN EL MUNDO REAL'),
    guidance: SPANISH_RESULT_DESCRIPTIONS[color].industry,
  };
}

export function getProfile(color: V2Color, lang: V2Lang) {
  return lang === 'es' ? spanishDefinition(color) : english[color];
}

export const V2_COPY = {
  en: {
    chooseLanguage: 'Choose your experience', english: 'English', spanish: 'Español',
    eyebrow: 'A clearer way to understand yourself',
    headline: 'Discover your natural personality. Unlock your potential.',
    intro: 'This is not a test of right or wrong. It is a practical look at how you decide, connect, adapt, and move through the world.',
    start: 'Start the quiz', questions: '50 thoughtfully selected questions', complete: 'completed personality assessments',
    question: 'Question', of: 'of', back: 'Back', next: 'Next', finish: 'See my result', saving: 'Saving your answer…',
    likertHint: 'Choose the response that feels most naturally like you.', singleHint: 'Choose the response closest to what you would actually do.',
    resultsEyebrow: 'Your primary personality', secondary: 'Secondary influence', profile: 'Your four-color profile', strengths: 'Natural strengths', challenges: 'Growth areas', guidance: 'Working with your style', share: 'Copy result link', copied: 'Result link copied', retake: 'Take the quiz again', loading: 'Preparing your VIAGO experience…',
  },
  es: {
    chooseLanguage: 'Elige tu experiencia', english: 'English', spanish: 'Español',
    eyebrow: 'Una manera más clara de conocerte',
    headline: 'Descubre tu personalidad natural. Desarrolla tu potencial.',
    intro: 'No es una prueba de respuestas correctas o incorrectas. Es una mirada práctica a cómo decides, conectas, te adaptas y avanzas por el mundo.',
    start: 'Comenzar el test', questions: '50 preguntas seleccionadas cuidadosamente', complete: 'evaluaciones de personalidad completadas',
    question: 'Pregunta', of: 'de', back: 'Atrás', next: 'Siguiente', finish: 'Ver mi resultado', saving: 'Guardando tu respuesta…',
    likertHint: 'Elige la respuesta que se parezca más a ti de forma natural.', singleHint: 'Elige la respuesta más cercana a lo que realmente harías.',
    resultsEyebrow: 'Tu personalidad principal', secondary: 'Influencia secundaria', profile: 'Tu perfil de cuatro colores', strengths: 'Fortalezas naturales', challenges: 'Áreas de crecimiento', guidance: 'Cómo trabajar con tu estilo', share: 'Copiar enlace del resultado', copied: 'Enlace copiado', retake: 'Volver a hacer el test', loading: 'Preparando tu experiencia VIAGO…',
  },
} as const;

export const LIKERT_COPY: Record<V2Lang, string[]> = {
  en: ['Not like me at all', 'Slightly like me', 'Somewhat like me', 'Very like me', 'Exactly like me'],
  es: ['Para nada como yo', 'Un poco como yo', 'Algo como yo', 'Muy como yo', 'Exactamente como yo'],
};
