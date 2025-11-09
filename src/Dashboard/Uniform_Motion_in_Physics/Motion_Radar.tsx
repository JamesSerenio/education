import { IonPage, IonHeader, IonContent } from "@ionic/react";
import { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  RadarController,
  Title,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../utils/supabaseClient";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  RadarController,
  Title,
  ChartDataLabels
);

const MAX_SCORE = 15;
const MAX_TIME = 525;

interface QuizRef {
  id: string;
  subject: string;
  category: string;
}

interface ScoreWithQuizzes {
  id: string;
  score: number | null;
  time_taken: number | null;
  created_at: string;
  quiz_id: string;
  quizzes: QuizRef | null;
}

const Motion_Radar: React.FC = () => {
  const radarRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  const [performance, setPerformance] = useState({
    time: 0,
    wordProblem: 0,
    problemSolving: 0,
  });
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const mapToScoreWithQuizzes = (rawData: Record<string, unknown>): ScoreWithQuizzes => {
    const quizzesRaw = rawData["quizzes"] as Record<string, unknown> | undefined;
    return {
      id: String(rawData["id"] ?? ""),
      score: rawData["score"] == null ? null : Number(rawData["score"]),
      time_taken: rawData["time_taken"] == null ? null : Number(rawData["time_taken"]),
      created_at: String(rawData["created_at"] ?? new Date().toISOString()),
      quiz_id: String(rawData["quiz_id"] ?? ""),
      quizzes: quizzesRaw
        ? {
            id: String(quizzesRaw["id"] ?? ""),
            category: String(quizzesRaw["category"] ?? ""),
            subject: String(quizzesRaw["subject"] ?? ""),
          }
        : null,
    };
  };

  const animateRadarUpdate = (newData: { time: number; wordProblem: number; problemSolving: number }, duration = 800) => {
    const steps = 30;
    const interval = duration / steps;
    let currentStep = 0;
    const start = { ...performance };

    const animate = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      setPerformance({
        time: start.time + (newData.time - start.time) * progress,
        wordProblem: start.wordProblem + (newData.wordProblem - start.wordProblem) * progress,
        problemSolving: start.problemSolving + (newData.problemSolving - start.problemSolving) * progress,
      });
      if (currentStep >= steps) clearInterval(animate);
    }, interval);
  };

  const fetchRadarData = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setPerformance({ time: 0, wordProblem: 0, problemSolving: 0 });
        return;
      }

      const { data: allScores, error: scoresError } = await supabase
        .from("scores")
        .select(`id, score, time_taken, created_at, quiz_id, quizzes!quiz_id(id, subject, category)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (scoresError) {
        setPerformance({ time: 0, wordProblem: 0, problemSolving: 0 });
        return;
      }

      const typedScores: ScoreWithQuizzes[] = (allScores ?? []).map(mapToScoreWithQuizzes);

      const motionScores = typedScores.filter(s => s.quizzes?.subject === "Uniform Motion in Physics");

      if (!motionScores.length) {
        setPerformance({ time: 0, wordProblem: 0, problemSolving: 0 });
        return;
      }

      const normalize = (txt: string | undefined) => txt?.trim().toLowerCase() ?? "";

      const wordProblemScores = motionScores.filter(s => normalize(s.quizzes?.category) === "word problem" && s.score !== null);
      const problemSolvingScores = motionScores.filter(s => normalize(s.quizzes?.category) === "problem solving" && s.score !== null);

      const bestWordProblem = wordProblemScores.length > 0 ? Math.max(...wordProblemScores.map(s => s.score ?? 0)) : 0;
      const bestProblemSolving = problemSolvingScores.length > 0 ? Math.max(...problemSolvingScores.map(s => s.score ?? 0)) : 0;

      const validTimes = motionScores.filter(s => s.time_taken !== null);
      const bestTime = validTimes.length > 0 ? Math.min(...validTimes.map(s => s.time_taken ?? MAX_TIME)) : MAX_TIME;

      const newPerformance = {
        time: Math.max(0, Math.min(100, ((MAX_TIME - bestTime) / MAX_TIME) * 100)),
        wordProblem: (bestWordProblem / MAX_SCORE) * 100,
        problemSolving: (bestProblemSolving / MAX_SCORE) * 100,
      };

      animateRadarUpdate(newPerformance);
    } catch {
      setPerformance({ time: 0, wordProblem: 0, problemSolving: 0 });
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  useEffect(() => {
    setVisible(true);
    void fetchRadarData();
  }, []);

  useEffect(() => {
    if (!radarRef.current) return;
    const ctx = radarRef.current.getContext("2d");
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 500);
    gradient.addColorStop(0, "rgba(54, 162, 235, 0.32)");
    gradient.addColorStop(1, "rgba(236, 72, 153, 0.32)");

    chartInstance.current = new ChartJS(ctx, {
      type: "radar",
      data: {
        labels: ["⏱ Time", "📘 Word Problem", "🧩 Problem Solving"],
        datasets: [
          {
            label: "🚀 Best Performance (Uniform Motion in Physics)",
            data: [performance.time, performance.wordProblem, performance.problemSolving],
            fill: true,
            backgroundColor: gradient,
            borderColor: "rgb(54, 162, 235)",
            borderWidth: 3,
            pointBackgroundColor: "rgb(236, 72, 153)",
            pointBorderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          title: { display: true, text: "📊 Uniform Motion in Physics" },
          datalabels: { color: "#000", font: { weight: "bold" }, formatter: (val: number) => `${val.toFixed(2)}%` },
        },
        scales: { r: { suggestedMin: 0, suggestedMax: 100, ticks: { display: false } } },
      },
      plugins: [ChartDataLabels],
    });

    return () => chartInstance.current?.destroy();
  }, [performance]);

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen className="arithmetic-radar-container">
        <AnimatePresence>
          {visible && (
            <motion.div
              key="motion-radar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="radar-content"
            >
              <motion.h2 className="radar-title" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                🌟 Best Performance Overview
              </motion.h2>

              <div className="radar-labels">
                {["⏱ Time", "📘 Word Problem", "🧩 Problem Solving"].map((label) => (
                  <motion.div key={label} className="radar-label" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
                    {label}
                  </motion.div>
                ))}
              </div>

              <div className="radar-card">
                <canvas ref={radarRef} />
              </div>

              <button
                onClick={fetchRadarData}
                className={`radar-refresh-btn ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? "🔄 Refreshing..." : "🔄 Refresh"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </IonContent>
    </IonPage>
  );
};

export default Motion_Radar;
