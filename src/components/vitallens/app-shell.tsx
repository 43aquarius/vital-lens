'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileImage, TrendingUp, HeartPulse, ClipboardList } from 'lucide-react';
import { LabDecoder } from './lab-decoder';
import { HealthTimeline } from './timeline';
import { SymptomChecker } from './symptom-checker';
import { DoctorPrep } from './doctor-prep';

export function AppShell() {
  const [tab, setTab] = useState('decoder');

  return (
    <div id="app" className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="mb-6 flex justify-center">
          <TabsList className="grid h-auto w-full max-w-2xl grid-cols-2 rounded-xl p-1.5 sm:grid-cols-4">
            <TabsTrigger value="decoder" className="gap-2 rounded-lg py-2.5 data-[state=active]:shadow-sm">
              <FileImage className="h-4 w-4" /><span className="hidden sm:inline">Lab Decoder</span><span className="sm:hidden">Labs</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2 rounded-lg py-2.5 data-[state=active]:shadow-sm">
              <TrendingUp className="h-4 w-4" /><span className="hidden sm:inline">Timeline</span><span className="sm:hidden">Trends</span>
            </TabsTrigger>
            <TabsTrigger value="symptoms" className="gap-2 rounded-lg py-2.5 data-[state=active]:shadow-sm">
              <HeartPulse className="h-4 w-4" /><span className="hidden sm:inline">Symptom Guide</span><span className="sm:hidden">Nurse V</span>
            </TabsTrigger>
            <TabsTrigger value="doctor" className="gap-2 rounded-lg py-2.5 data-[state=active]:shadow-sm">
              <ClipboardList className="h-4 w-4" /><span className="hidden sm:inline">Doctor Prep</span><span className="sm:hidden">Prep</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="decoder"><LabDecoder onGoTimeline={() => setTab('timeline')} /></TabsContent>
        <TabsContent value="timeline"><HealthTimeline /></TabsContent>
        <TabsContent value="symptoms"><SymptomChecker /></TabsContent>
        <TabsContent value="doctor"><DoctorPrep /></TabsContent>
      </Tabs>
    </div>
  );
}
