import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VIAGO Personality',
  description: 'Discover your natural personality and unlock your potential with VIAGO.',
};

export default function V2Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
