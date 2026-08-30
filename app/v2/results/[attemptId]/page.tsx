import V2ResultsClient from './results-client';

export default async function V2ResultsPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  return <V2ResultsClient attemptId={attemptId} />;
}
