import { Suspense } from 'react';
import V2QuizClient from './quiz-client';

export default function V2QuizPage() {
  return <Suspense fallback={<div className="v2-page grid min-h-screen place-items-center text-white/60">Preparing VIAGO…</div>}><V2QuizClient /></Suspense>;
}
