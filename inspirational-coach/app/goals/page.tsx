"use client";

import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, orderBy, where } from "firebase/firestore";
import { useUser } from "../context/UserContext";
import { useDarkMode } from "../context/DarkModeContext";
import axios from "axios";
import Link from "next/link";
import Progress from "../components/ui/Progress";
import PageLayout from "../components/layout/PageLayout";
import PageHeader from "../components/layout/PageHeader";
import {
  Target, PlusCircle, RefreshCw, X, Filter,
  CheckCircle, Award, Calendar, TrendingUp,
  Clipboard, PieChart, BookOpen, Sparkles
} from "lucide-react";

interface Goal {
  id: string;
  title: string;
  category: string;
  deadline: string;
  progress: number;
  completed: boolean;
  createdAt: number;
  userId: string;
}

const GOAL_SETTING_TIPS = [
  "Break down larger goals into smaller, manageable tasks. Celebrating small wins keeps you motivated throughout your journey.",
  "Write your goals down. People who write their goals are 42% more likely to achieve them according to research from Dominican University.",
  "Use the SMART framework: make your goals Specific, Measurable, Achievable, Relevant, and Time-bound.",
  "Tell someone you trust about your goal. Public commitment dramatically increases follow-through.",
  "Review your goals weekly. Goals you don't revisit tend to drift out of focus and lose priority.",
  "Focus on systems, not just outcomes. The daily habits that lead to a goal matter more than the goal itself.",
  "When you fail or fall behind, ask 'what can I learn?' not 'why am I bad at this?' — growth mindset wins.",
  "Stack your new habits onto existing ones. After morning coffee, write one sentence about today's priority.",
  "Track progress visually. Seeing a streak or chart builds momentum that pure willpower can't sustain.",
  "Make the first step ridiculously small. The barrier to starting matters more than the size of the goal."
];

export default function Goals() {
  const { user, loading: userLoading } = useUser();
  const { darkMode } = useDarkMode();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Health");
  const [deadline, setDeadline] = useState("");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState("");
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [filter, setFilter] = useState("all");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(
    Math.floor(Math.random() * GOAL_SETTING_TIPS.length)
  );

  const categories = [
    { name: "Health", icon: "🏃‍♂️" },
    { name: "Career", icon: "💼" },
    { name: "Learning", icon: "📚" },
    { name: "Mindfulness", icon: "🧘‍♀️" },
    { name: "Finance", icon: "💰" },
    { name: "Personal Growth", icon: "🌱" }
  ];

  useEffect(() => {
    const fetchGoals = async () => {
      if (!user) {
        setGoals([]);
        return;
      }

      setLoading(true);
      try {
        const goalsQuery = query(
          collection(db, "goals"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(goalsQuery);
        setGoals(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Goal)));
      } catch (error) {
        console.error("Error fetching goals:", error);
      }
      setLoading(false);
    };

    fetchGoals();
  }, [user]);

  const addGoal = async () => {
    if (!title || !deadline || !user) {
      alert("Please enter a goal title and deadline.");
      return;
    }

    setLoading(true);
    try {
      const newGoal = {
        title,
        category,
        deadline,
        progress: 0,
        completed: false,
        createdAt: Date.now(),
        userId: user.uid,
      };

      const docRef = await addDoc(collection(db, "goals"), newGoal);
      setGoals([{ id: docRef.id, ...newGoal }, ...goals]);
      setTitle("");
      setDeadline("");
      setIsFormVisible(false);
    } catch (error) {
      console.error("Error adding goal:", error);
    }
    setLoading(false);
  };

  const updateGoalProgress = async (goalId: string, newProgress: number) => {
    try {
      newProgress = Math.max(0, Math.min(100, newProgress));

      const goalDoc = doc(db, "goals", goalId);
      await updateDoc(goalDoc, {
        progress: newProgress,
        completed: newProgress >= 100
      });

      setGoals(
        goals.map((goal) =>
          goal.id === goalId ? { ...goal, progress: newProgress, completed: newProgress >= 100 } : goal
        )
      );

      if (activeGoal && activeGoal.id === goalId) {
        setActiveGoal({ ...activeGoal, progress: newProgress, completed: newProgress >= 100 });
      }
    } catch (error) {
      console.error("Error updating goal:", error);
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;

    try {
      await deleteDoc(doc(db, "goals", goalId));
      setGoals(goals.filter(goal => goal.id !== goalId));
      if (activeGoal && activeGoal.id === goalId) {
        setActiveGoal(null);
        setMotivationalMessage("");
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const generateMotivation = async (goal: Goal) => {
    setLoading(true);
    setActiveGoal(goal);

    try {
      const response = await axios.post("http://localhost:8000/goal", {
        prompt: `You are a personal inspirational coach. Generate ONE single, cohesive inspirational message (2-3 sentences) that:

          1. Directly addresses the goal titled "${goal.title}".
          2. Acknowledges the current progress of ${goal.progress}%.
          3. Highlights the category of ${goal.category}.
          4. Considers the deadline of ${goal.deadline}.
          5. Uses an encouraging, supportive tone.
          6. Speaks directly to the reader using "you".
          7. Is complete and well-structured.

          Do not use bullet points or multiple options. Do not include phrases like "Here is an inspirational message." Do not label or explain the output. Simply provide the inspirational message itself, with a clear beginning and end.`,
        max_tokens: 150,
      });

      setMotivationalMessage(response.data.response);
    } catch (error) {
      console.error("Error generating motivation:", error);
      const fallbackMessages = [
        `You're making great progress on your ${goal.category} goal "${goal.title}". Keep pushing forward!`,
        `Every step toward your ${goal.category} goal matters. You've already achieved ${goal.progress}% - keep going!`,
        `Your commitment to "${goal.title}" is inspiring. Stay focused on your deadline and you'll succeed.`
      ];
      setMotivationalMessage(fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)]);
    }

    setLoading(false);
  };

  const handleNewTip = () => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * GOAL_SETTING_TIPS.length);
    } while (nextIndex === currentTipIndex);
    setCurrentTipIndex(nextIndex);
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === "completed") return goal.completed;
    if (filter === "in-progress") return !goal.completed && goal.progress > 0;
    if (filter === "not-started") return goal.progress === 0;
    return true;
  });

  const getDaysRemaining = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineColor = (deadline: string, completed: boolean) => {
    if (completed) return darkMode ? "text-green-400" : "text-green-500";

    const days = getDaysRemaining(deadline);
    if (days < 0) return "text-red-500";
    if (days < 3) return "text-red-400";
    if (days < 7) return "text-orange-400";
    return darkMode ? "text-gray-400" : "text-gray-500";
  };

  const getDeadlineText = (deadline: string, completed: boolean) => {
    if (completed) return "Completed";

    const days = getDaysRemaining(deadline);
    if (days < 0) return `Overdue by ${Math.abs(days)} days`;
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `${days} days left`;
  };

  const categoriesByUsage = [...categories].sort((a, b) => {
    const countA = goals.filter(goal => goal.category === a.name).length;
    const countB = goals.filter(goal => goal.category === b.name).length;
    return countB - countA;
  });

  const goalsHeader = (
    <PageHeader
      title="Transform Your Aspirations into Achievements"
      description="Set meaningful goals, track your progress, and get personalized motivation to help you succeed."
      gradientFrom="blue-500"
      gradientTo="green-500"
      icon={<Target size={24} />}
    />
  );

  if (userLoading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className={`animate-spin h-8 w-8 border-4 ${darkMode ? "border-blue-400 border-t-transparent" : "border-blue-500 border-t-transparent"} rounded-full`}></div>
          <span className={`ml-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Loading...</span>
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className={`${darkMode ? "bg-gray-800" : "bg-white"} p-8 rounded-xl shadow-lg max-w-md w-full text-center`}>
            <Target className={`h-12 w-12 ${darkMode ? "text-orange-400" : "text-orange-500"} mx-auto mb-4`} />
            <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"} mb-2`}>Sign In Required</h1>
            <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} mb-6`}>
              Please sign in to access your personal goals and start tracking your progress.
            </p>
            <Link href="/">
              <button className={`px-6 py-3 ${darkMode ? "bg-orange-600 hover:bg-orange-700" : "bg-orange-500 hover:bg-orange-600"} text-white rounded-lg transition w-full`}>
                Go to Home Page
              </button>
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout pageHeader={goalsHeader}>
      <div className="flex flex-col md:flex-row gap-8 p-6 max-w-6xl mx-auto w-full">
        <div className="md:w-3/5 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"} flex items-center gap-2`}>
              <Target className={darkMode ? "text-blue-400" : "text-blue-500"} />
              Your Goals
            </h2>
            <button
              onClick={() => setIsFormVisible(!isFormVisible)}
              className={`px-4 py-2 ${darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"} text-white rounded-lg shadow hover:shadow-md transition flex items-center gap-1`}
            >
              {isFormVisible ? (
                <>
                  <X size={18} /> Cancel
                </>
              ) : (
                <>
                  <PlusCircle size={18} /> Add Goal
                </>
              )}
            </button>
          </div>

          {isFormVisible && (
            <div className={`${darkMode ? "bg-gray-800 border-gray-700" : "bg-white"} shadow-md rounded-xl overflow-hidden animate-fade-in`}>
              <div className={`h-3 ${darkMode ? "bg-blue-600" : "bg-blue-500"}`}></div>
              <div className="p-6">
                <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"} mb-4`}>Create a New Goal</h3>

                <input
                  type="text"
                  placeholder="What do you want to achieve?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full border ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-700"} rounded-md p-3 mb-4 focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-blue-500" : "focus:ring-blue-400"}`}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={`w-full border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-700"} rounded-md p-3 focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-blue-500" : "focus:ring-blue-400"}`}
                    >
                      {categories.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-1`}>
                      Target Completion Date
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className={`w-full border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-700"} rounded-md p-3 focus:outline-none focus:ring-2 ${darkMode ? "focus:ring-blue-500" : "focus:ring-blue-400"}`}
                    />
                  </div>
                </div>

                <button
                  onClick={addGoal}
                  disabled={loading || !title || !deadline}
                  className={`w-full px-6 py-3 ${darkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"} text-white rounded-lg shadow hover:shadow-md transition flex items-center justify-center gap-2 ${(loading || !title || !deadline) ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle size={18} />
                      <span>Create Goal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          <div className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow-md rounded-xl overflow-hidden`}>
            <div className="p-4 flex flex-wrap gap-2">
              <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-md transition flex items-center gap-1 ${filter === "all" ? darkMode ? "bg-blue-600 text-white" : "bg-blue-500 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                <Clipboard size={16} /> All
              </button>
              <button onClick={() => setFilter("in-progress")} className={`px-4 py-2 rounded-md transition flex items-center gap-1 ${filter === "in-progress" ? darkMode ? "bg-blue-600 text-white" : "bg-blue-500 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                <TrendingUp size={16} /> In Progress
              </button>
              <button onClick={() => setFilter("not-started")} className={`px-4 py-2 rounded-md transition flex items-center gap-1 ${filter === "not-started" ? darkMode ? "bg-blue-600 text-white" : "bg-blue-500 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                <Calendar size={16} /> Not Started
              </button>
              <button onClick={() => setFilter("completed")} className={`px-4 py-2 rounded-md transition flex items-center gap-1 ${filter === "completed" ? darkMode ? "bg-green-600 text-white" : "bg-green-500 text-white" : darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                <CheckCircle size={16} /> Completed
              </button>
            </div>
          </div>

          {loading && goals.length === 0 ? (
            <div className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow-md rounded-xl p-6 text-center`}>
              <div className="flex justify-center mb-3">
                <RefreshCw size={24} className={`${darkMode ? "text-blue-400" : "text-blue-500"} animate-spin`} />
              </div>
              <p className={darkMode ? "text-gray-300" : "text-gray-500"}>Loading your goals...</p>
            </div>
          ) : filteredGoals.length > 0 ? (
            <div className="space-y-4">
              {filteredGoals.map((goal) => {
                const deadlineColor = getDeadlineColor(goal.deadline, goal.completed);
                const deadlineText = getDeadlineText(goal.deadline, goal.completed);

                return (
                  <div key={goal.id} className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow-md rounded-xl overflow-hidden ${activeGoal?.id === goal.id ? darkMode ? "ring-2 ring-blue-500" : "ring-2 ring-blue-400" : ""}`}>
                    <div className={`h-1 ${goal.completed ? darkMode ? "bg-green-600" : "bg-green-500" : goal.progress > 0 ? darkMode ? "bg-blue-600" : "bg-blue-500" : darkMode ? "bg-gray-600" : "bg-gray-400"}`}></div>

                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className={`font-semibold text-lg ${darkMode ? "text-white" : "text-gray-800"} flex items-center gap-2`}>
                            {categories.find(cat => cat.name === goal.category)?.icon}
                            {goal.title}
                            {goal.completed && (
                              <span className={`text-xs ${darkMode ? "bg-green-900 text-green-300" : "bg-green-100 text-green-700"} px-2 py-1 rounded flex items-center gap-1`}>
                                <CheckCircle size={12} /> Achieved
                              </span>
                            )}
                          </h4>
                          <div className="flex gap-3 text-xs mt-1">
                            <span className={darkMode ? "text-gray-400" : "text-gray-600"}>{goal.category}</span>
                            <span className={deadlineColor}>{deadlineText}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => deleteGoal(goal.id)} className={`${darkMode ? "text-gray-400 hover:text-red-400" : "text-gray-400 hover:text-red-500"} transition`} title="Delete goal">
                            <X size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{goal.progress}% complete</span>
                          <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Target: {new Date(goal.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className={goal.completed ? darkMode ? "bg-green-600" : "bg-green-500" : ""}>
                          <Progress value={goal.progress} />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => updateGoalProgress(goal.id, goal.progress - 10)} className={`px-3 py-1 ${darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"} rounded hover:shadow transition text-sm flex items-center gap-1`} disabled={goal.progress <= 0 || goal.completed}>-10%</button>
                        <button onClick={() => updateGoalProgress(goal.id, goal.progress + 10)} className={`px-3 py-1 ${darkMode ? "bg-blue-900 text-blue-300 hover:bg-blue-800" : "bg-blue-100 text-blue-600 hover:bg-blue-200"} rounded hover:shadow transition text-sm flex items-center gap-1`} disabled={goal.progress >= 100 || goal.completed}>+10%</button>
                        {goal.progress < 100 && !goal.completed && (
                          <button onClick={() => updateGoalProgress(goal.id, 100)} className={`px-3 py-1 ${darkMode ? "bg-green-700 text-white hover:bg-green-600" : "bg-green-500 text-white hover:bg-green-600"} rounded hover:shadow transition text-sm flex items-center gap-1`}>
                            <CheckCircle size={14} /> Complete
                          </button>
                        )}
                        <button onClick={() => generateMotivation(goal)} className={`px-3 py-1 ${darkMode ? "bg-purple-900 text-purple-300 hover:bg-purple-800" : "bg-purple-100 text-purple-600 hover:bg-purple-200"} rounded hover:shadow transition text-sm ml-auto flex items-center gap-1`}>
                          <Sparkles size={14} /> Get Motivated
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow-md rounded-xl p-8 text-center`}>
              <div className="flex justify-center mb-4">
                <Target size={32} className={darkMode ? "text-gray-600" : "text-gray-400"} />
              </div>
              <p className={`${darkMode ? "text-gray-400" : "text-gray-500"} italic mb-4`}>No {filter !== 'all' ? filter.replace('-', ' ') + ' ' : ''}goals found.</p>
              {filter !== 'all' ? (
                <button onClick={() => setFilter('all')} className={`${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-500 hover:text-blue-600"} hover:underline`}>Show all goals</button>
              ) : (
                <button onClick={() => setIsFormVisible(true)} className={`px-4 py-2 ${darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"} text-white rounded-lg shadow transition flex items-center gap-1 mx-auto`}>
                  <PlusCircle size={18} /> Create your first goal
                </button>
              )}
            </div>
          )}
        </div>

        <div className="md:w-2/5 space-y-6">
          <div className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow-md rounded-xl overflow-hidden`}>
            <div className={`h-3 ${darkMode ? "bg-purple-600" : "bg-purple-500"}`}></div>
            <div className="p-6">
              <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"} mb-4 flex items-center gap-2`}>
                <Sparkles className={darkMode ? "text-purple-400" : "text-purple-500"} /> Your Personalized Motivation
              </h3>

              {activeGoal ? (
                <div>
                  <div className={`mb-4 p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                    <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}><span className="font-medium">Selected Goal:</span> {activeGoal.title}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-grow h-2"><Progress value={activeGoal.progress} /></div>
                      <span className={`text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{activeGoal.progress}%</span>
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-center py-8">
                      <RefreshCw size={24} className={`${darkMode ? "text-purple-400" : "text-purple-500"} animate-spin mx-auto mb-3`} />
                      <p className={darkMode ? "text-gray-300" : "text-gray-600"}>Generating your motivation...</p>
                    </div>
                  ) : motivationalMessage ? (
                    <div className={`p-4 rounded-lg ${darkMode ? "bg-purple-900/20" : "bg-purple-50"} border ${darkMode ? "border-purple-800" : "border-purple-100"}`}>
                      <p className={`italic ${darkMode ? "text-gray-200" : "text-gray-700"} mb-3`}>"{motivationalMessage}"</p>
                      <button onClick={() => generateMotivation(activeGoal)} className={`text-sm ${darkMode ? "text-purple-400 hover:text-purple-300" : "text-purple-600 hover:text-purple-700"} flex items-center gap-1`}>
                        <RefreshCw size={14} /> Regenerate
                      </button>
                    </div>
                  ) : (
                    <p className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-center py-4`}>Your motivation will appear here.</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award size={32} className={darkMode ? "text-gray-600 mx-auto" : "text-gray-400 mx-auto"} />
                  <p className={`${darkMode ? "text-gray-400" : "text-gray-500"} mt-4`}>Select a goal and click "Get Motivated" to receive personalized encouragement.</p>
                </div>
              )}
            </div>
          </div>

          <div className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow-md rounded-xl overflow-hidden`}>
            <div className={`h-3 ${darkMode ? "bg-green-600" : "bg-green-500"}`}></div>
            <div className="p-6">
              <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"} mb-4 flex items-center gap-2`}>
                <TrendingUp className={darkMode ? "text-green-400" : "text-green-500"} /> Your Progress Summary
              </h3>

              {goals.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                      <h4 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>Completion Rate</h4>
                      <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{Math.round((goals.filter(g => g.completed).length / goals.length) * 100)}%</p>
                    </div>
                    <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                      <h4 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"} mb-1`}>Goals In Progress</h4>
                      <p className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{goals.filter(g => g.progress > 0 && !g.completed).length}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"} mb-3`}>Goals by Category</h4>
                    <div className="space-y-2">
                      {categoriesByUsage.filter(cat => goals.some(g => g.category === cat.name)).map(cat => {
                        const categoryGoals = goals.filter(g => g.category === cat.name);
                        const completedInCategory = categoryGoals.filter(g => g.completed).length;
                        const percentage = (completedInCategory / categoryGoals.length) * 100;

                        return (
                          <div key={cat.name} className="flex items-center gap-3">
                            <span className="text-xl">{cat.icon}</span>
                            <div className="flex-grow">
                              <div className="flex justify-between items-center">
                                <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{cat.name}</span>
                                <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{completedInCategory}/{categoryGoals.length} completed</span>
                              </div>
                              <div className="mt-1 h-1"><Progress value={percentage} /></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-600"} mb-3 flex items-center gap-1`}>
                      <Award size={16} className={darkMode ? "text-yellow-400" : "text-yellow-500"} /> Recent Achievements
                    </h4>

                    {goals.filter(g => g.completed).length > 0 ? (
                      <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                        <ul className="space-y-2">
                          {goals.filter(g => g.completed).sort((a, b) => b.progress - a.progress).slice(0, 3).map(goal => (
                            <li key={goal.id} className="flex items-center gap-2">
                              <CheckCircle size={16} className={darkMode ? "text-green-400" : "text-green-500"} />
                              <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{goal.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className={`text-sm italic ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No completed goals yet. Keep pushing!</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <PieChart size={32} className={darkMode ? "text-gray-600 mx-auto" : "text-gray-400 mx-auto"} />
                  <p className={`${darkMode ? "text-gray-400" : "text-gray-500"} mt-4`}>Add some goals to see your progress statistics here.</p>
                </div>
              )}
            </div>
          </div>

          <div className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow-md rounded-xl overflow-hidden`}>
            <div className={`h-3 ${darkMode ? "bg-yellow-600" : "bg-yellow-500"}`}></div>
            <div className="p-6">
              <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"} mb-4 flex items-center gap-2`}>
                <BookOpen className={darkMode ? "text-yellow-400" : "text-yellow-500"} /> Goal Setting Tips
              </h3>

              <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                <p className={`${darkMode ? "text-gray-300" : "text-gray-700"} mb-3`}>
                  <span className="font-medium">Tip of the day:</span> {GOAL_SETTING_TIPS[currentTipIndex]}
                </p>
                <button
                  onClick={handleNewTip}
                  className={`text-sm ${darkMode ? "text-yellow-400 hover:text-yellow-300" : "text-yellow-600 hover:text-yellow-700"} flex items-center gap-1`}
                >
                  <RefreshCw size={14} /> New Tip
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}