

// ==============================

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
    const { data } = await supabase.from('jobs').select('*');
    setJobs(data || []);
    setLoading(false);
  }

  function toggleJobSelection(jobId: string) {
    const newSelected = new Set(selectedJobIds);
    newSelected.has(jobId) ? newSelected.delete(jobId) : newSelected.add(jobId);
    setSelectedJobIds(newSelected);
  }

  async function proceedToTaskSelection() {
    if (selectedJobIds.size === 0) return;

    setLoading(true);
    const jobsData: JobWithOnetActivities[] = [];

    for (const jobId of Array.from(selectedJobIds)) {
      const job = jobs.find(j => j.id === jobId);
      if (!job) continue;

      const { data: links } = await supabase
        .from('job_onet_activities')
        .select('onet_activity_id')
        .eq('job_id', jobId);

      const ids = (links || []).map(l => l.onet_activity_id);

      const { data: acts } = await supabase
        .from('onet_activities')
        .select('*')
        .in('id', ids);

      jobsData.push({
        ...job,
        onet_activities: acts || []
      });
    }

    setJobsWithActivities(jobsData);
    setStep('select-tasks');
    setLoading(false);
  }

  function toggleOnetActivity(jobId: string, activityId: string) {
    const newMap = new Map(selectedOnetActivities);
    const jobActivities = newMap.get(jobId) || new Set<string>();

    jobActivities.has(activityId)
      ? jobActivities.delete(activityId)
      : jobActivities.add(activityId);

    newMap.set(jobId, jobActivities);
    setSelectedOnetActivities(newMap);
  }

  async function generateResults() {
    const competencyMap = new Map();

    for (const job of jobsWithActivities) {
      const selected = selectedOnetActivities.get(job.id);
      if (!selected) continue;

      for (const actId of selected) {
        const act = job.onet_activities.find(a => a.id === actId);
        if (!act) continue;

        const { data } = await supabase
          .from('nace_competencies')
          .select('*')
          .eq('id', act.nace_competency_id)
          .single();

        if (!data) continue;

        if (!competencyMap.has(data.id)) {
          competencyMap.set(data.id, { competency: data, activities: [] });
        }

        competencyMap.get(data.id).activities.push(act);
      }
    }

    setFinalCompetencies(Array.from(competencyMap.values()));
    setStep('view-results');
  }

  const groupedJobs = jobs.reduce((acc, job) => {
    acc[job.category] = acc[job.category] || [];
    acc[job.category].push(job);
    return acc;
  }, {} as Record<string, Job[]>);

  // ✅ FIXED ORDER HERE
  const categoryOrder = [
    'Academic',
    'Clinical',
    'Conservation',
    'Industry',
    'Leadership',
    'Professional Development',
    'Research',
    'Teaching',
    'Outreach',
    'Other'
  ];

  // ✅ STRICT ORDER (NO RANDOM APPEND)
  const orderedCategories = categoryOrder.filter(c => groupedJobs[c]);

  if (loading) return <div className="text-center p-10">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center">NACE Competency Tracker</h1>

      {step === 'select-jobs' && (
        <>
          <h2 className="text-xl font-bold mt-6 mb-4">Step 1: Select Jobs You've Completed</h2>

          {orderedCategories.map(category => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">{category}</h3>

              <div className="grid md:grid-cols-2 gap-3">
                {groupedJobs[category].map(job => (
                  <label key={job.id} className="flex gap-3 border p-4 rounded">
                    <input
                      type="checkbox"
                      checked={selectedJobIds.has(job.id)}
                      onChange={() => toggleJobSelection(job.id)}
                    />
                    <div>
                      <div className="font-semibold">{job.title}</div>
                      <div className="text-sm text-gray-500">{job.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button onClick={proceedToTaskSelection} className="mt-4 px-6 py-2 bg-teal-600 text-white rounded">
            Next
          </button>
        </>
      )}
    </div>
  );
}

export default App;
