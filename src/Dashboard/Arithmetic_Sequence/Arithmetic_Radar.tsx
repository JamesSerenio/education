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
import "../../global.css"; // ✅ Make sure this is imported

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

// 🧮 Performance constants
const MAX_SCORE = 15; // 15 questions total
const MAX_TIME = 525; // total 15s×5 + 30s×5 + 60s×5

interface ScoreWithQuizzes {
  id: string;
  score: number | null;
  time_taken: number | null;
  created_at: string;
  quiz_id: string;
  quizzes: { id: string; category: string; subject?: string } | null;
}

const Arithmetic_Radar: React.FC = () => {
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
            subject: quizzesRaw["subject"] ? String(quizzesRaw["subject"]) : undefined,
          }
        : null,
    };
  };

  // ✨ Animate radar update
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
        time:
          startValues.time + (newData.time - startValues.time) * progress,
        wordProblem:
          startValues.wordProblem +
          (newData.wordProblem - startValues.wordProblem) * progress,
        problemSolving:
          startValues.problemSolving +
          (newData.problemSolving - startValues.problemSolving) * progress,
      });

      if (currentStep >= steps) clearInterval(animate);
    }, interval);
  };

  // 📊 Fetch data
  const fetchRadarData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setPerformance({ time: 0, wordProblem: 0, problemSolving: 0 });
        return;
      }

      const { data: allScores, error: scoresError } = await supabase
        .from("scores")
        .select(
          `id, score, time_taken, created_at, quiz_id, quizzes!quiz_id(id, category, subject)`
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (scoresError) {
        console.error("Error fetching scores:", scoresError);
        setPerformance({ time: 0, wordProblem: 0, problemSolving: 0 });
        return;
      }

      const rawArray = (allScores ?? []) as Record<string, unknown>[];
      const typedScores: ScoreWithQuizzes[] = rawArray.map(mapToScoreWithQuizzes);

      if (!typedScores.length) {
        setPerformance({ time: 0, wordProblem: 0, problemSolving: 0 });
        return;
      }

      const arithmeticScores = typedScores.filter(
        (s) => s.quizzes?.subject?.toLowerCase() === "arithmetic sequence"
      );

      if (!arithmeticScores.length) {
        setPerformance({ time: 0, wordProblem: 0, problemSolving: 0 });
        return;
      }

      const normalize = (txt: string | undefined) => txt?.trim().toLowerCase() ?? "";

      const wordProblemScores = arithmeticScores.filter(
        (s) => normalize(s.quizzes?.category) === "word problem" && s.score !== null
      );

      const problemSolvingScores = arithmeticScores.filter(
        (s) => normalize(s.quizzes?.category) === "problem solving" && s.score !== null
      );

      const bestWordProblem =
        wordProblemScores.length > 0
          ? Math.max(...wordProblemScores.map((s) => s.score ?? 0))
          : 0;

      const bestProblemSolving =
        problemSolvingScores.length > 0
          ? Math.max(...problemSolvingScores.map((s) => s.score ?? 0))
          : 0;

      const validTimes = arithmeticScores.filter((s) => s.time_taken !== null);
      const bestTime =
        validTimes.length > 0
          ? Math.min(...validTimes.map((s) => s.time_taken ?? MAX_TIME))
          : MAX_TIME;

      const timePercent = ((MAX_TIME - bestTime) / MAX_TIME) * 100;

      const newPerformance = {
        time: Math.max(0, Math.min(100, parseFloat(timePercent.toFixed(2)))),
        wordProblem: (bestWordProblem / MAX_SCORE) * 100,
        problemSolving: (bestProblemSolving / MAX_SCORE) * 100,
      };

      console.log("✅ Computed performance:", newPerformance);
      animateRadarUpdate(newPerformance);
    } catch (err) {
      console.error("Error fetching radar data:", err);
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
    gradient.addColorStop(0, "rgba(101, 163, 13, 0.35)");
    gradient.addColorStop(1, "rgba(234, 179, 8, 0.35)");

    chartInstance.current = new ChartJS(ctx, {
      type: "radar",
      data: {
        labels: ["⏱ Time", "📘 Word Problem", "🧩 Problem Solving"],
        datasets: [
          {
            label: "🏆 Best Performance (Arithmetic Sequence)",
            data: [
              performance.time,
              performance.wordProblem,
              performance.problemSolving,
            ],
            fill: true,
            backgroundColor: gradient,
            borderColor: "#65a30d",
            borderWidth: 3,
            pointBackgroundColor: "#eab308",
            pointBorderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: "#111", font: { size: 13, weight: "bold" } },
          },
          title: {
            display: true,
            text: "📊 Arithmetic Sequence",
            color: "#111",
            font: { size: 18, weight: "bold" },
          },
          datalabels: {
            color: "#000",
            font: { weight: "bold", size: 11 },
            formatter: (val: number) => {
              const isWhole = Number.isInteger(val);
              return isWhole ? `${val}%` : `${val.toFixed(2)}%`;
            },
          },
        },
        scales: {
          r: {
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: { display: false },
          },
        },
      },
      plugins: [ChartDataLabels],
    });

    return () => {
      chartInstance.current?.destroy();
      chartInstance.current = null;
    };
  }, [performance]);

  const labels = ["⏱ Time", "📘 Word Problem", "🧩 Problem Solving"];

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen className="arithmetic-radar-container">
        <AnimatePresence>
          {visible && (
            <motion.div
              key="radar-root"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="radar-content"
            >
              <motion.h2
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="radar-title"
              >
                🏅 Best Performance Overview
              </motion.h2>

              <div className="radar-labels">
                {labels.map((label, idx) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.25 + idx * 0.14 }}
                    className="radar-label"
                  >
                    {label}
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="radar-card"
              >
                <canvas ref={radarRef} />
              </motion.div>

              <motion.button
                onClick={fetchRadarData}
                disabled={loading}
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: loading ? 1 : 1.03 }}
                className={`radar-refresh-btn ${loading ? "loading" : ""}`}
              >
                {loading ? "🔄 Refreshing..." : "🔄 Refresh"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </IonContent>
    </IonPage>
  );
};

export default Arithmetic_Radar;
