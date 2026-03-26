import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Briefcase, GraduationCap, ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
}

interface OnetActivity {
  id: string;
  name: string;
  description: string;
  nace_competency_id: string;
}

interface Competency {
  id: string;
  name: string;
  description: string;
}

interface JobWithActivities extends Job {
  onet_activities: OnetActivity[];
}

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [jobsWithActivities, setJobsWithActivities] = useState<JobWithActivities[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<Map<string, Set<string>>>(new Map());
  const [results, setResults] = useState<any[]>([]);
  const [step, setStep] = useState<'jobs' | 'tasks' | 'results'>('jobs');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    const { data } = await supabase.from('jobs').select('*');
    setJobs(data || []);
    setLoading(false);
  }

  function toggleJob(id: string) {
    const newSet = new Set(selectedJobIds);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedJobIds(newSet);
  }

  async function goToTasks() {
    setLoading(true);
    const data: JobWithActivities[] = [];

    for (const id of selectedJobIds) {
      const job = jobs.find(j => j.id === id);
      if (!job) continue;

      const { data: links } = await supabase
        .from('job_onet_activities')
        .select('onet_activity_id')
        .eq('job_id', id);

      const ids = (links || []).map(l => l.onet_activity_id);

      const { data: acts } = await supabase
        .from('onet_activities')
        .select('*')
        .in('id', ids);

      data.push({
        ...job,
        onet_activities: acts || []
      });
    }

    setJobsWithActivities(data);
    setStep('tasks');
    setLoading(false);
  }

  function toggleActivity(jobId: string, actId: string) {
    const map = new Map(selectedActivities);
    const set = map.get(jobId) || new Set<string>();

    set.has(actId) ? set.delete(actId) : set.add(actId);

    map.set(jobId, set);
    setSelectedActivities(map);
  }

  async function generateResults() {
    const map = new Map<string, { competency: Competency; activities: OnetActivity[] }>();

    for (const job of jobsWithActivities) {
      const selected = selectedActivities.get(job.id);
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

        if (!map.has(data.id)) {
          map.set(data.id, { competency: data, activities: [] });
        }

        map.get(data.id)!.activities.push(act);
      }
    }

    setResults(Array.from(map.values()));
    setStep('results');
  }

  const grouped = jobs.reduce((acc: any, job) => {
    acc[job.category] = acc[job.category] || [];
    acc[job.category].push(job);
    return acc;
  }, {});

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


    const ordered = categoryOrder.filter((c) => grouped[c]);
   

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2 text-center">NACE Competency Tracker</h1>
      <p className="text-center mb-6 text-gray-600">
        Reflect on your experiences and discover which competencies you've developed
      </p>

      {step === 'jobs' && (
        <>
          <h2 className="text-xl font-bold mb-4">Step 1: Select Jobs You've Completed</h2>

          {ordered.map(category => (
            <div key={category} className="mb-6">
              <h3 className="font-semibold text-gray-500 uppercase mb-2">{category}</h3>

              <div className="grid md:grid-cols-2 gap-3">
                {grouped[category].map((job: Job) => (
                  <label key={job.id} className="border p-4 rounded cursor-pointer flex gap-3">
                    <input
                      type="checkbox"
                      checked={selectedJobIds.has(job.id)}
                      onChange={() => toggleJob(job.id)}
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

          <button onClick={goToTasks} className="mt-4 px-6 py-2 bg-teal-600 text-white rounded">
            Next
          </button>
        </>
      )}

      {step === 'tasks' && (
        <>
          <h2 className="text-xl font-bold mb-4">Step 2: What Tasks Did You Do?</h2>

          {jobsWithActivities.map(job => (
            <div key={job.id} className="mb-6 border p-4 rounded">
              <h3 className="font-bold mb-3">{job.title}</h3>

              {job.onet_activities.length === 0 ? (
                <p className="text-red-500">No activities found</p>
              ) : (
                job.onet_activities.map(act => (
                  <label key={act.id} className="block mb-2">
                    <input
                      type="checkbox"
                      onChange={() => toggleActivity(job.id, act.id)}
                    />{' '}
                    {act.name}
                  </label>
                ))
              )}
            </div>
          ))}

          <button onClick={generateResults} className="px-6 py-2 bg-teal-600 text-white rounded">
            Show Results
          </button>
        </>
      )}

      {step === 'results' && (
        <>
          <h2 className="text-xl font-bold mb-4">Your Competencies</h2>

          {results.map(r => (
            <div key={r.competency.id} className="mb-4 border p-4 rounded">
              <h3 className="font-bold">{r.competency.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{r.competency.description}</p>

              <ul className="list-disc pl-5">
                {r.activities.map((a: any, i: number) => (
                  <li key={i}>{a.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
