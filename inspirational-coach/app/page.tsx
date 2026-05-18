'use client';

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Star, Target, BookOpen, Sparkles, MessageCircle } from "lucide-react";
import AuthButtons from "./components/AuthButtons";
import PageLayout from "./components/layout/PageLayout";
import { useDarkMode } from "./context/DarkModeContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

export default function Home() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [inspiration, setInspiration] = useState(
    "The journey of a thousand miles begins with a single step. Today is your day to take that step with courage and conviction."
  );

  const refreshInspiration = () => {
    const inspirations = [
      "The journey of a thousand miles begins with a single step. Today is your day to take that step with courage and conviction.",
      "Your potential is limitless. Embrace each challenge as an opportunity to grow and transform.",
      "Small daily improvements lead to stunning results over time. Focus on progress, not perfection.",
      "You are stronger than you know and more capable than you believe. Trust in your ability to overcome.",
      "Be the author of your own story. Today is a new page, and the pen is in your hand."
    ];
    
    let newInspiration = inspiration;
    while (newInspiration === inspiration) {
      newInspiration = inspirations[Math.floor(Math.random() * inspirations.length)];
    }
    setInspiration(newInspiration);
  };

  // Create custom Navbar with integrated auth buttons
  const CustomNavbar = () => {
    return (
      <nav className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm py-4 px-6 flex justify-between items-center sticky top-0 z-10`}>
        <Link href="/" className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"} flex items-center gap-2`}>
          <Sparkles className={`h-6 w-6 ${darkMode ? "text-blue-400" : "text-blue-500"}`} />
          <span>Inspirational Coach</span>
        </Link>
        
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex space-x-6">
            <Link href="/journal" className={`transition flex items-center gap-1 ${darkMode ? "text-gray-300 hover:text-blue-400" : "text-gray-600 hover:text-blue-500"}`}>
              <BookOpen className="h-4 w-4" />
              <span>Journal</span>
            </Link>
            <Link href="/personalized-content" className={`transition flex items-center gap-1 ${darkMode ? "text-gray-300 hover:text-blue-400" : "text-gray-600 hover:text-blue-500"}`}>
              <Sparkles className="h-4 w-4" />
              <span>Personalized Inspiration</span>
            </Link>
            <Link href="/affirmations" className={`transition flex items-center gap-1 ${darkMode ? "text-gray-300 hover:text-blue-400" : "text-gray-600 hover:text-blue-500"}`}>
              <Star className="h-4 w-4" />
              <span>Daily Affirmations</span>
            </Link>
            <Link href="/goals" className={`transition flex items-center gap-1 ${darkMode ? "text-gray-300 hover:text-blue-400" : "text-gray-600 hover:text-blue-500"}`}>
              <Target className="h-4 w-4" />
              <span>Goal Tracking</span>
            </Link>
            <Link href="/feedback" className={`transition flex items-center gap-1 ${darkMode ? "text-gray-300 hover:text-blue-400" : "text-gray-600 hover:text-blue-500"}`}>
              <MessageCircle className="h-4 w-4" />
              <span>Feedback</span>
            </Link>
          </div>
          
          <div className="ml-6">
            <AuthButtons />
          </div>
        </div>
      </nav>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col ${
      darkMode 
        ? "bg-gradient-to-b from-gray-900 to-gray-800 text-white" 
        : "bg-gradient-to-b from-gray-50 to-gray-100 text-gray-900"
    }`}>
      <CustomNavbar />
      
      {/* Hero Section */}
      <section className={`py-16 px-6 ${darkMode ? "bg-gradient-to-r from-blue-900 to-purple-900" : "bg-gradient-to-r from-blue-50 to-purple-50"}`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 text-left md:pr-12">
            <h1 className={`text-4xl md:text-5xl font-bold ${darkMode ? "text-white" : "text-gray-900"} leading-tight`}>
              Elevate Your <span className={darkMode ? "text-blue-400" : "text-blue-600"}>Journey</span> of Personal Growth
            </h1>
            <p className={`${darkMode ? "text-gray-300" : "text-gray-700"} mt-6 text-lg`}>
              Discover a more fulfilled life with daily affirmations, personalized goal setting, and guided journaling. 
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/journal">
                <button className={`px-6 py-3 ${darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-600 hover:bg-blue-700"} text-white rounded-lg shadow-md transition flex items-center justify-center gap-2`}>
                  <span>Start Your Journey</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/personalized-content">
                <button className={`px-6 py-3 ${darkMode ? "bg-gray-800 text-blue-400 border border-blue-700 hover:bg-gray-700" : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"} rounded-lg shadow-sm transition`}>
                  Explore Features
                </button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 mt-12 md:mt-0">
            <div className={`${darkMode ? "bg-gray-800" : "bg-white"} p-6 rounded-xl shadow-xl`}>
              <div onClick={refreshInspiration} className={`bg-gradient-to-br ${darkMode ? "from-blue-800 to-purple-900" : "from-blue-500 to-purple-600"} text-white p-8 rounded-lg cursor-pointer transition hover:shadow-lg`}>
                <h3 className="text-xl font-medium">Today's Inspiration</h3>
                <p className="mt-4 text-lg italic">{inspiration}</p>
                <div className="mt-4 text-blue-100 text-sm">Tap to refresh</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-16 px-6 ${darkMode ? "bg-gray-900" : "bg-white"}`}>
        <div className="max-w-6xl mx-auto">
          <h2 className={`text-3xl font-bold text-center ${darkMode ? "text-white" : "text-gray-900"} mb-12`}>
            Tools for Your Personal Growth Journey
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature: Goal Setting */}
            <div className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow-md rounded-xl overflow-hidden transition-all hover:shadow-xl`}>
              <div className="h-3 bg-orange-500"></div>
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Goal Setting</h3>
                <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} mt-3`}>
                  Define clear objectives, track your progress, and celebrate milestones along your personal growth journey.
                </p>
                <Link href="/goals">
                  <button className={`mt-6 px-4 py-2 ${darkMode ? "bg-orange-600 hover:bg-orange-700" : "bg-orange-500 hover:bg-orange-600"} text-white rounded-md shadow transition flex items-center gap-2`}>
                    <span>Track Goals</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Feature: Daily Affirmations */}
            <div className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow-md rounded-xl overflow-hidden transition-all hover:shadow-xl`}>
              <div className="h-3 bg-green-500"></div>
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-green-500" />
                </div>
                <h3 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Daily Affirmations</h3>
                <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} mt-3`}>
                  Start each day with positive affirmations tailored to your mindset and current challenges.
                </p>
                <Link href="/affirmations">
                  <button className={`mt-6 px-4 py-2 ${darkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"} text-white rounded-md shadow transition flex items-center gap-2`}>
                    <span>Get Inspired</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Feature: Personalized Inspiration */}
            <div className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow-md rounded-xl overflow-hidden transition-all hover:shadow-xl`}>
              <div className="h-3 bg-purple-500"></div>
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>Personalized Inspiration</h3>
                <p className={`${darkMode ? "text-gray-300" : "text-gray-600"} mt-3`}>
                  Receive AI-powered inspiration that resonates with your cultural background, values, and personal goals.
                </p>
                <Link href="/personalized-content">
                  <button className={`mt-6 px-4 py-2 ${darkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-500 hover:bg-purple-600"} text-white rounded-md shadow transition flex items-center gap-2`}>
                    <span>Explore Now</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
