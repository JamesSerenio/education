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

const MAX_SCORE = 5;
const MAX_TIME = 300;

interface QuizRef {
  id: string;
  category: string;
  subject?: string;
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

  const [attempts, setAttempts] = useState<ScoreWithQuizzes[][]>([]);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [performance, setPerformance] = useState({
    time: 0,
    solving: 0,
    problemSolving: 0,
  });
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  // 🔹 Animate radar update
  const animateRadarUpdate = (
    newScore: { time: number; solving: number; problemSolving: number },
    duration = 1000
  ) => {
    const steps = 30;
    const interval = duration / steps;
    let step = 0;
    const start = { ...performance };

    const anim = setInterval(() => {
      step++;
      const progress = step / steps;
      setPerformance({
        time: start.time + (newScore.time - start.time) * progress,
        solving: start.solving + (newScore.solving - start.solving) * progress,
        problemSolving:
          start.problemSolving +
          (newScore.problemSolving - start.problemSolving) * progress,
      });
      if (step >= steps) clearInterval(anim);
    }, interval);
  };

  const mapToScoreWithQuizzes = (
    rawData: Record<string, unknown>
  ): ScoreWithQuizzes => {
    const quizzesRaw = rawData["quizzes"] as Record<string, unknown> | undefined;
    return {
      id: String(rawData["id"] ?? ""),
      score: rawData["score"] ? Number(rawData["score"]) : null,
      time_taken: rawData["time_taken"] ? Number(rawData["time_taken"]) : null,
      created_at: String(rawData["created_at"] ?? new Date().toISOString()),
      quiz_id: String(rawData["quiz_id"] ?? ""),
      quizzes: quizzesRaw
        ? {
            id: String(quizzesRaw["id"] ?? ""),
            category: String(quizzesRaw["category"] ?? ""),
            subject: quizzesRaw["subject"]
              ? String(quizzesRaw["subject"])
              : undefined,
          }
        : null,
    };
  };

  // 🔹 Group data by attempts (based on created_at date batches)
  const groupAttempts = (scores: ScoreWithQuizzes[]): ScoreWithQuizzes[][] => {
    const grouped: ScoreWithQuizzes[][] = [];
    let currentGroup: ScoreWithQuizzes[] = [];
    let lastDate = "";

    scores.forEach((score) => {
      const date = new Date(score.created_at).toDateString();
      if (date !== lastDate && currentGroup.length > 0) {
        grouped.push(currentGroup);
        currentGroup = [];
      }
      currentGroup.push(score);
      lastDate = date;
    });
    if (currentGroup.length > 0) grouped.push(currentGroup);
    return grouped;
  };

  // 🔹 Calculate radar data for a given attempt
  const updateRadarForAttempt = (index: number, data = attempts) => {
    const target = data[index];
    if (!target || target.length === 0) {
      animateRadarUpdate({ time: 0, solving: 0, problemSolving: 0 });
      return;
    }

    const avgTime =
      target.reduce((sum, s) => sum + (s.time_taken || 0), 0) / target.length;
    const timePercent = Math.max(
      0,
      Math.min(100, ((MAX_TIME - avgTime) / MAX_TIME) * 100)
    );

    const solvingScores = target.filter(
      (s) => s.quizzes?.category === "Solving"
    );
    const problemScores = target.filter(
      (s) => s.quizzes?.category === "Problem Solving"
    );

    const avgSolving =
      solvingScores.length > 0
        ? (solvingScores.reduce((sum, s) => sum + (s.score || 0), 0) /
            (solvingScores.length * MAX_SCORE)) *
          100
        : 0;

    const avgProblemSolving =
      problemScores.length > 0
        ? (problemScores.reduce((sum, s) => sum + (s.score || 0), 0) /
            (problemScores.length * MAX_SCORE)) *
          100
        : 0;

    animateRadarUpdate({
      time: Number(timePercent.toFixed(2)),
      solving: Number(avgSolving.toFixed(2)),
      problemSolving: Number(avgProblemSolving.toFixed(2)),
    });
  };

  const fetchRadarData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("scores")
        .select(
          `id, score, time_taken, created_at, quiz_id, quizzes!quiz_id(id, category, subject)`
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const motionScores = (data ?? [])
        .map(mapToScoreWithQuizzes)
        .filter((s) => s.quizzes?.subject === "Uniform Motion in Physics");

      const grouped = groupAttempts(motionScores);
      setAttempts(grouped);

      if (grouped.length > 0) updateRadarForAttempt(grouped.length - 1, grouped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setVisible(true);
    fetchRadarData();
  }, []);

  useEffect(() => {
    if (!radarRef.current) return;
    const ctx = radarRef.current.getContext("2d");
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(54, 162, 235, 0.3)");
    gradient.addColorStop(1, "rgba(236, 72, 153, 0.3)");

    chartInstance.current = new ChartJS(ctx, {
      type: "radar",
      data: {
        labels: ["⏱ Time", "🧮 Solving", "🧩 Problem Solving"],
        datasets: [
          {
            label: "Uniform Motion in Physics",
            data: [
              performance.time,
              performance.solving,
              performance.problemSolving,
            ],
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
          datalabels: {
            color: "#000",
            font: { size: 11, weight: "bold" },
            formatter: (v) => `${v.toFixed(0)}%`,
          },
          legend: { display: false },
          title: {
            display: true,
            text: "📊 Uniform Motion in Physics Progress",
            font: { size: 18, weight: "bold" },
          },
        },
        scales: {
          r: {
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: { display: false },
            pointLabels: { font: { size: 12, weight: "bold" } },
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

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen>
        <AnimatePresence>
          {visible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: 20,
              }}
            >
              <h2 style={{ fontWeight: "bold", fontSize: 22 }}>
                📈 Motion Radar Progress
              </h2>

              {/* Attempt Selector */}
              <div style={{ marginTop: 16 }}>
                <select
                  value={currentAttempt}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setCurrentAttempt(idx);
                    updateRadarForAttempt(idx);
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #ccc",
                    fontWeight: "bold",
                  }}
                >
                  {attempts.map((_, i) => (
                    <option key={i} value={i}>
                      {i + 1}ᵗʰ Attempt
                    </option>
                  ))}
                </select>
              </div>

              {/* Radar */}
              <div
                style={{
                  width: "100%",
                  maxWidth: 480,
                  height: 420,
                  marginTop: 20,
                  background: "#fff",
                  borderRadius: 16,
                  boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 12,
                }}
              >
                <canvas ref={radarRef}></canvas>
              </div>

              {/* Refresh Button */}
              <motion.button
                onClick={fetchRadarData}
                whileTap={{ scale: 0.95 }}
                style={{
                  marginTop: 20,
                  background: "linear-gradient(90deg,#36A2EB,#EC4899)",
                  color: "#fff",
                  fontWeight: "bold",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                🔄 {loading ? "Refreshing..." : "Refresh Data"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </IonContent>
    </IonPage>
  );
};

export default Motion_Radar;
