import { Hammer } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { SectionCard } from '@/components/layout/PageShell';
import { EmptyState } from '@/components/ui/EmptyState';

interface ComingSoonProps {
  heading:     string;
  description: string;
}

export function ComingSoon({ heading, description }: ComingSoonProps) {
  return (
    <PageShell heading={heading} description={description}>
      <SectionCard>
        <EmptyState
          icon={<Hammer size={40} />}
          title="Module Under Development"
          message="This screen is being built. Check back soon — it'll be ready for the next phase."
        />
      </SectionCard>
    </PageShell>
  );
}
