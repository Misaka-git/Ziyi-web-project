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

interface JobOnetActivityJoinRow {
  onet_activities: OnetActivity | OnetActivity[] | null;
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

    if (error) {
      console.error('Error loading jobs:', error);
    } else {
      setJobs(data || []);
    }

    setLoading(false);
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

async function proceedToTaskSelection() {
  if (selectedJobIds.size === 0) return;

  setLoading(true);
  const jobsData: JobWithOnetActivities[] = [];

  for (const jobId of Array.from(selectedJobIds)) {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) continue;

    const { data: links, error: linksError } = await supabase
      .from('job_onet_activities')
      .select('onet_activity_id')
      .eq('job_id', jobId);

    if (linksError) {
      console.error('Error loading links:', linksError);
      continue;
    }

    const activityIds = (links ?? []).map((row) => row.onet_activity_id);

    if (activityIds.length === 0) {
      jobsData.push({
        ...job,
        onet_activities: []
      });
      continue;
    }

    const { data: activities, error: activitiesError } = await supabase
      .from('onet_activities')
      .select('*')
      .in('id', activityIds);

    if (activitiesError) {
      console.error('Error loading activities:', activitiesError);
      continue;
    }

    jobsData.push({
      ...job,
      onet_activities: activities || []
    });
  }

  setJobsWithActivities(jobsData);
  setStep('select-tasks');
  setLoading(false);
}

  function toggleOnetActivity(jobId: string, activityId: string) {
    const newMap = new Map(selectedOnetActivities);
    const jobActivities = newMap.get(jobId) || new Set<string>();

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
  }

  async function generateResults() {
    setLoading(true);

    const competencyMap = new Map<string, { competency: Competency; activities: OnetActivity[] }>();

    for (const job of jobsWithActivities) {
      const selectedActivitiesForJob = selectedOnetActivities.get(job.id);
      if (!selectedActivitiesForJob) continue;

      for (const activityId of selectedActivitiesForJob) {
        const activity = job.onet_activities.find((a) => a.id === activityId);
        if (!activity) continue;

        const { data: competency, error } = await supabase
          .from('nace_competencies')
          .select('*')
          .eq('id', activity.nace_competency_id)
          .maybeSingle();

        if (error) {
          console.error(`Error loading competency for activity ${activity.id}:`, error);
          continue;
        }

        if (competency) {
          if (competencyMap.has(competency.id)) {
            competencyMap.get(competency.id)!.activities.push(activity);
          } else {
            competencyMap.set(competency.id, {
              competency,
              activities: [activity],
            });
          }
        }
      }
    }

    setFinalCompetencies(Array.from(competencyMap.values()));
    setStep('view-results');
    setLoading(false);
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
    selectedOnetActivities.forEach((activities) => {
      total += activities.size;
    });
    return total;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <GraduationCap className="w-12 h-12 text-teal-600" />
            <h1 className="text-4xl font-bold text-gray-900">NACE Competency Tracker</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Reflect on your experiences and discover which NACE competencies you've developed
          </p>

          <div className="flex items-center justify-center gap-8 mt-6">
            <div className={`flex items-center gap-2 ${step === 'select-jobs' ? 'text-teal-600 font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'select-jobs' ? 'bg-teal-600 text-white' : 'bg-gray-300 text-gray-600'}`}>1</div>
              <span>Select Jobs</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <div className={`flex items-center gap-2 ${step === 'select-tasks' ? 'text-teal-600 font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'select-tasks' ? 'bg-teal-600 text-white' : 'bg-gray-300 text-gray-600'}`}>2</div>
              <span>Reflect on Tasks</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
            <div className={`flex items-center gap-2 ${step === 'view-results' ? 'text-teal-600 font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'view-results' ? 'bg-teal-600 text-white' : 'bg-gray-300 text-gray-600'}`}>3</div>
              <span>View Results</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {step === 'select-jobs' && (
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                <div className="flex items-center gap-2 mb-6">
                  <Briefcase className="w-6 h-6 text-teal-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Step 1: Select Activities You've Completed
                  </h2>
                </div>

                <div className="space-y-6">
                  {Object.entries(groupedJobs).map(([category, categoryJobs]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        {category}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categoryJobs.map((job) => (
                          <label
                            key={job.id}
                            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedJobIds.has(job.id)
                                ? 'border-teal-500 bg-teal-50'
                                : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedJobIds.has(job.id)}
                              onChange={() => toggleJobSelection(job.id)}
                              className="mt-1 w-5 h-5 text-teal-600 rounded focus:ring-teal-500 focus:ring-2"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{job.title}</div>
                              <div className="text-sm text-gray-600 mt-1">{job.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedJobIds.size > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-700">
                        <span className="font-semibold">{selectedJobIds.size}</span> job{selectedJobIds.size !== 1 ? 's' : ''} selected
                      </p>
                      <button
                        onClick={proceedToTaskSelection}
                        className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
                      >
                        Next: Reflect on Tasks
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 'select-tasks' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Step 2: What Tasks Did You Do?
                      </h2>
                      <p className="text-gray-600 mt-1">
                        For each activity, check the specific tasks you performed
                      </p>
                    </div>
                    <button
                      onClick={() => setStep('select-jobs')}
                      className="text-gray-600 hover:text-gray-900 underline"
                    >
                      Back
                    </button>
                  </div>

                  <div className="space-y-6">
                    {jobsWithActivities.map((job) => (
                      <div key={job.id} className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">{job.title}</h3>

                        <div className="space-y-2">
                          {job.onet_activities.length > 0 ? (
                            job.onet_activities.map((activity) => (
                              <label
                                key={activity.id}
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                  selectedOnetActivities.get(job.id)?.has(activity.id)
                                    ? 'border-teal-500 bg-teal-50'
                                    : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedOnetActivities.get(job.id)?.has(activity.id) || false}
                                  onChange={() => toggleOnetActivity(job.id, activity.id)}
                                  className="mt-0.5 w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{activity.name}</div>
                                  <div className="text-sm text-gray-600 mt-0.5">{activity.description}</div>
                                </div>
                              </label>
                            ))
                          ) : (
                            <p className="text-sm text-red-500">
                              No activities found for this job.
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {getTotalSelectedTasks() > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-700">
                          <span className="font-semibold">{getTotalSelectedTasks()}</span> task{getTotalSelectedTasks() !== 1 ? 's' : ''} selected
                        </p>
                        <button
                          onClick={generateResults}
                          className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
                        >
                          <TrendingUp className="w-5 h-5" />
                          Show My NACE Competencies
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 'view-results' && finalCompetencies.length > 0 && (
              <div className="space-y-8">
                <div className="bg-gradient-to-br from-teal-600 to-cyan-600 rounded-2xl shadow-xl p-8 text-white">
                  <h2 className="text-3xl font-bold mb-2">Your NACE Competencies</h2>
                  <p className="text-teal-100 mb-8">Based on the tasks you've completed</p>

                  <div className="space-y-4">
                    {finalCompetencies.map(({ competency, activities }) => (
                      <div key={competency.id} className="bg-white/10 backdrop-blur rounded-lg p-5 border border-white/20">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold mb-1">{competency.name}</h3>
                            <p className="text-teal-100 text-sm">{competency.description}</p>
                          </div>
                          <CheckCircle2 className="w-8 h-8 text-green-300 flex-shrink-0 ml-4" />
                        </div>

                        <div className="mt-3 pt-3 border-t border-white/20">
                          <p className="text-sm text-teal-100 mb-2 font-semibold">Evidence from your activities:</p>
                          <ul className="space-y-1">
                            {activities.map((activity, idx) => (
                              <li key={idx} className="text-sm text-white/90">
                                • {activity.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 p-4 bg-white/10 backdrop-blur rounded-lg border border-white/20">
                    <p className="text-lg">
                      <span className="font-bold">Summary:</span> You have demonstrated{' '}
                      {finalCompetencies.length} key NACE competencies through your activities. Use these specific examples when updating your resume and preparing for interviews.
                    </p>
                  </div>

                  <div className="mt-6 text-center">
                    <button
                      onClick={resetFlow}
                      className="px-6 py-3 bg-white text-teal-600 font-semibold rounded-lg hover:bg-teal-50 transition-colors"
                    >
                      Start Over
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
