import {
  IonPage,
  IonHeader,
  IonContent,
} from "@ionic/react";
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
import "../../global.css";

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

interface ScoreWithQuizzes {
  id: string;
  score: number | null;
  time_taken: number | null;
  created_at: string;
  quiz_id: string;
  quizzes: { id: string; category: string; subject?: string } | null;
}

const Motion_Radar: React.FC = () => {
  const radarRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  const [performance, setPerformance] = useState({
    time: 0,
    wordProblem: 0,
    problemSolving: 0,
  });
  const [categoryPercent, setCategoryPercent] = useState({
    time: 0,
    wordProblem: 0,
    problemSolving: 0,
  });
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<ScoreWithQuizzes[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const mapToScoreWithQuizzes = (rawData: Record<string, unknown>): ScoreWithQuizzes => {
    const quizzesRaw = rawData["quizzes"] as Record<string, unknown> | undefined;
    return {
      id: String(rawData["id"] ?? ""),
      score: rawData["score"] == null ? 0 : Number(rawData["score"]),
      time_taken: rawData["time_taken"] == null ? MAX_TIME : Number(rawData["time_taken"]),
      created_at: String(rawData["created_at"] ?? new Date().toISOString()),
      quiz_id: String(rawData["quiz_id"] ?? ""),
      quizzes: quizzesRaw
        ? {
            id: String(quizzesRaw["id"] ?? ""),
            category: String(quizzesRaw["category"] ?? ""),
            subject: quizzesRaw["subject"] ? String(quizzesRaw["subject"]) : undefined,
          }
        : null,
    };
  };

  const animateRadarUpdate = (
    newData: { time: number; wordProblem: number; problemSolving: number },
    duration = 800
  ) => {
    const steps = 30;
    const interval = duration / steps;
    let currentStep = 0;
    const startValues = { ...performance };

    const animate = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      setPerformance({
        time: startValues.time + (newData.time - startValues.time) * progress,
        wordProblem: startValues.wordProblem + (newData.wordProblem - startValues.wordProblem) * progress,
        problemSolving: startValues.problemSolving + (newData.problemSolving - startValues.problemSolving) * progress,
      });
      if (currentStep >= steps) clearInterval(animate);
    }, interval);
  };

  const fetchRadarData = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      const { data: allScores, error: scoresError } = await supabase
        .from("scores")
        .select(`id, score, time_taken, created_at, quiz_id, quizzes!quiz_id(id, category, subject)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (scoresError) return;

      const typedScores = (allScores ?? []).map(mapToScoreWithQuizzes);
      setScores(typedScores);

      const motionScores = typedScores.filter(
        (s) => s.quizzes?.subject?.toLowerCase() === "uniform motion in physics"
      );

      const wordProblemScores = motionScores.filter(s => s.quizzes?.category.toLowerCase() === "word problem");
      const problemSolvingScores = motionScores.filter(s => s.quizzes?.category.toLowerCase() === "problem solving");

      const bestWordProblem = wordProblemScores.length ? Math.max(...wordProblemScores.map(s => s.score ?? 0)) : 0;
      const bestProblemSolving = problemSolvingScores.length ? Math.max(...problemSolvingScores.map(s => s.score ?? 0)) : 0;
      const bestTime = motionScores.length ? Math.min(...motionScores.map(s => s.time_taken ?? MAX_TIME)) : MAX_TIME;

      const newPerformance = {
        time: ((MAX_TIME - bestTime) / MAX_TIME) * 100,
        wordProblem: (bestWordProblem / MAX_SCORE) * 100,
        problemSolving: (bestProblemSolving / MAX_SCORE) * 100,
      };

      setCategoryPercent(newPerformance);
      animateRadarUpdate(newPerformance);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  // Initial load
  useEffect(() => {
    setVisible(true);
    fetchRadarData();
  }, []);

  // Chart.js update
  useEffect(() => {
    if (!radarRef.current) return;
    const ctx = radarRef.current.getContext("2d");
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.data.datasets[0].data = [
        performance.time,
        performance.wordProblem,
        performance.problemSolving,
      ];
      chartInstance.current.update();
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(54,162,235,0.4)");
    gradient.addColorStop(1, "rgba(236,72,153,0.4)");

    chartInstance.current = new ChartJS(ctx, {
      type: "radar",
      data: {
        labels: ["⏱ Time", "📘 Word Problem", "🧩 Problem Solving"],
        datasets: [
          {
            label: "🏆 Best Performance (Uniform Motion in Physics)",
            data: [
              performance.time,
              performance.wordProblem,
              performance.problemSolving,
            ],
            fill: true,
            backgroundColor: gradient,
            borderColor: "#2563eb",
            borderWidth: 3,
            pointBackgroundColor: "#ec4899",
            pointBorderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#333" } },
          title: {
            display: true,
            text: "📊 Uniform Motion in Physics",
            color: "#111",
            font: { size: 18, weight: "bold" },
          },
          datalabels: {
            color: "#000",
            font: { weight: "bold", size: 11 },
            formatter: (val: number) => `${val.toFixed(1)}%`,
          },
        },
        scales: { r: { suggestedMin: 0, suggestedMax: 100, ticks: { display: false } } },
      },
      plugins: [ChartDataLabels],
    });
  }, [performance]);

  const labels = ["⏱ Time", "📘 Word Problem", "🧩 Problem Solving"];
  const handleLabelClick = (label: string) => {
    const map: Record<string, string> = { "⏱ Time": "time", "📘 Word Problem": "word problem", "🧩 Problem Solving": "problem solving" };
    setSelectedCategory(map[label]);
  };

  const getCategoryRecords = () => {
    const normalize = (txt?: string) => txt?.trim().toLowerCase() ?? "";
    if (!selectedCategory) return [];
    return scores.filter(s =>
      s.quizzes?.subject?.toLowerCase() === "uniform motion in physics" &&
      (selectedCategory === "time" || normalize(s.quizzes?.category) === selectedCategory)
    );
  };

  const recordPercent = (record: ScoreWithQuizzes) => {
    if (selectedCategory === "time") return ((MAX_TIME - record.time_taken!) / MAX_TIME) * 100;
    return (record.score! / MAX_SCORE) * 100;
  };

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen className="arithmetic-radar-container">
        <AnimatePresence>
          {visible && (
            <motion.div key="radar-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="radar-content">
              {!selectedCategory ? (
                <>
                  <motion.h2 className="radar-title" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    🏅 Best Performance Overview
                  </motion.h2>

                  <div className="radar-labels">
                    {labels.map(label => <motion.div key={label} className="radar-label" onClick={() => handleLabelClick(label)}>{label}</motion.div>)}
                  </div>

                  <motion.div className="radar-card" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                    <canvas ref={radarRef} />
                  </motion.div>

                  <motion.button onClick={fetchRadarData} disabled={loading} whileTap={{ scale: 0.96 }} className={`radar-refresh-btn ${loading ? "loading" : ""}`}>
                    {loading ? "🔄 Refreshing..." : "🔄 Refresh"}
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.h2 className="radar-title">📘 {selectedCategory.toUpperCase()} RECORDS</motion.h2>
                  <p style={{ fontWeight: "bold", marginBottom: "12px" }}>
                    Total Percent:{" "}
                    {selectedCategory === "time" ? categoryPercent.time.toFixed(1) :
                     selectedCategory === "word problem" ? categoryPercent.wordProblem.toFixed(1) :
                     categoryPercent.problemSolving.toFixed(1)}%
                  </p>

                  <div style={{ textAlign: "left", marginTop: "15px" }}>
                    {getCategoryRecords().length ? getCategoryRecords().map(record => (
                      <div key={record.id} style={{ background: "#f8fafc", padding: "10px", borderRadius: "10px", marginBottom: "8px" }}>
                        <strong>Score:</strong> {record.score} / {MAX_SCORE}<br />
                        <strong>Time Taken:</strong> {record.time_taken}s<br />
                        <strong>Percent:</strong> {recordPercent(record).toFixed(1)}%<br />
                        <small>{new Date(record.created_at).toLocaleString()}</small>
                      </div>
                    )) : <p>No records found.</p>}
                  </div>

                  <motion.button onClick={() => setSelectedCategory(null)} whileTap={{ scale: 0.95 }} className="radar-refresh-btn" style={{ marginTop: "20px" }}>
                    ⬅ Back to Radar
                  </motion.button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </IonContent>
    </IonPage>
  );
};

export default Motion_Radar;
