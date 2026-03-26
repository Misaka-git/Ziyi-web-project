import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Briefcase, CheckCircle2, GraduationCap, TrendingUp, ArrowRight } from 'lucide-react';

interface Job {
id: string;
title: string;
description: string;
category: string;
}

interface Competency {
id: string;
name: string;
description: string;
}

interface OnetActivity {
id: string;
name: string;
description: string;
nace_competency_id: string;
}

interface JobWithOnetActivities extends Job {
onet_activities: OnetActivity[];
}

function App() {
const [jobs, setJobs] = useState<Job[]>([]);
const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
const [step, setStep] = useState<'select-jobs' | 'select-tasks' | 'view-results'>('select-jobs');
const [jobsWithActivities, setJobsWithActivities] = useState<JobWithOnetActivities[]>([]);
const [selectedOnetActivities, setSelectedOnetActivities] = useState<Map<string, Set<string>>>(new Map());
const [finalCompetencies, setFinalCompetencies] = useState<Array<{ competency: Competency; activities: OnetActivity[] }>>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
loadJobs();
}, []);

async function loadJobs() {
const { data, error } = await supabase
.from('jobs')
.select('*')
.order('category', { ascending: true });

```
if (error) {
  console.error('Error loading jobs:', error);
} else {
  setJobs(data || []);
}
setLoading(false);
```

}

function toggleJobSelection(jobId: string) {
const newSelected = new Set(selectedJobIds);
if (newSelected.has(jobId)) {
newSelected.delete(jobId);
} else {
newSelected.add(jobId);
}
setSelectedJobIds(newSelected);
}

// ✅ FIXED FUNCTION
async function proceedToTaskSelection() {
if (selectedJobIds.size === 0) return;

```
setLoading(true);
const jobsData: JobWithOnetActivities[] = [];

for (const jobId of Array.from(selectedJobIds)) {
  const job = jobs.find(j => j.id === jobId);
  if (!job) continue;

  const { data, error } = await supabase
    .from('job_onet_activities')
    .select(`
      onet_activities (
        id,
        name,
        description,
        nace_competency_id
      )
    `)
    .eq('job_id', jobId);

  if (error) {
    console.error('Error loading activities:', error);
    continue;
  }

  const activities = (data ?? [])
    .map((row: any) => row.onet_activities)
    .filter(Boolean) as OnetActivity[];

  jobsData.push({
    ...job,
    onet_activities: activities
  });
}

setJobsWithActivities(jobsData);
setStep('select-tasks');
setLoading(false);
```

}

function toggleOnetActivity(jobId: string, activityId: string) {
const newMap = new Map(selectedOnetActivities);
const jobActivities = newMap.get(jobId) || new Set<string>();

```
if (jobActivities.has(activityId)) {
  jobActivities.delete(activityId);
} else {
  jobActivities.add(activityId);
}

if (jobActivities.size === 0) {
  newMap.delete(jobId);
} else {
  newMap.set(jobId, jobActivities);
}

setSelectedOnetActivities(newMap);
```

}

async function generateResults() {
setLoading(true);

```
const competencyMap = new Map<string, { competency: Competency; activities: OnetActivity[] }>();

for (const job of jobsWithActivities) {
  const selectedActivitiesForJob = selectedOnetActivities.get(job.id);
  if (!selectedActivitiesForJob) continue;

  for (const activityId of selectedActivitiesForJob) {
    const activity = job.onet_activities.find(a => a.id === activityId);
    if (!activity) continue;

    const { data: competency } = await supabase
      .from('nace_competencies')
      .select('*')
      .eq('id', activity.nace_competency_id)
      .maybeSingle();

    if (competency) {
      if (competencyMap.has(competency.id)) {
        competencyMap.get(competency.id)!.activities.push(activity);
      } else {
        competencyMap.set(competency.id, {
          competency,
          activities: [activity]
        });
      }
    }
  }
}

setFinalCompetencies(Array.from(competencyMap.values()));
setStep('view-results');
setLoading(false);
```

}

function resetFlow() {
setStep('select-jobs');
setSelectedJobIds(new Set());
setJobsWithActivities([]);
setSelectedOnetActivities(new Map());
setFinalCompetencies([]);
}

const groupedJobs = jobs.reduce((acc, job) => {
if (!acc[job.category]) {
acc[job.category] = [];
}
acc[job.category].push(job);
return acc;
}, {} as Record<string, Job[]>);

const getTotalSelectedTasks = () => {
let total = 0;
selectedOnetActivities.forEach(activities => {
total += activities.size;
});
return total;
};

return ( <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50"> <div className="max-w-7xl mx-auto px-4 py-12"> <header className="text-center mb-12"> <div className="flex items-center justify-center gap-3 mb-4"> <GraduationCap className="w-12 h-12 text-teal-600" /> <h1 className="text-4xl font-bold text-gray-900">NACE Competency Tracker</h1> </div>

```
      <div className="flex items-center justify-center gap-8 mt-6">
        <div className="flex items-center gap-2 text-teal-600 font-semibold">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-teal-600 text-white">1</div>
          <span>Select Jobs</span>
        </div>
      </div>
    </header>

    {/* rest of UI unchanged */}
  </div>
</div>
```

);
}

export default App;
