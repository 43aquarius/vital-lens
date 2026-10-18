import { AppShell } from '@/components/vitallens/app-shell';
import { Hero } from '@/components/vitallens/hero';
import { HowItWorks, Safety, SiteFooter } from '@/components/vitallens/sections';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Hero />
      <main className="flex-1 pb-20">
        <AppShell />
        <div className="mt-24">
          <HowItWorks />
        </div>
        <div className="mt-24">
          <Safety />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
