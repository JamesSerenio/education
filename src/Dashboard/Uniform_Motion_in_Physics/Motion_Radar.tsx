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
      score:
        rawData["score"] === undefined || rawData["score"] === null
          ? null
          : Number(rawData["score"]),
      time_taken:
        rawData["time_taken"] === undefined || rawData["time_taken"] === null
          ? null
          : Number(rawData["time_taken"]),
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

  const animateRadarUpdate = (
    newData: { time: number; wordProblem: number; problemSolving: number },
    duration = 800
  ) => {
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
        problemSolving:
          start.problemSolving + (newData.problemSolving - start.problemSolving) * progress,
      });
      if (currentStep >= steps) clearInterval(animate);
    }, interval);
  };

  const fetchRadarData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("No user logged in:", userError);
        setPerformance({ time: 0, wordProblem: 0, problemSolving: 0 });
        return;
      }

      const { data: allScores, error: scoresError } = await supabase
        .from("scores")
        .select(
          `id, score, time_taken, created_at, quiz_id, quizzes!quiz_id(id, subject, category)`
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

      const motionScores = typedScores.filter(
        (s) => s.quizzes?.subject === "Uniform Motion in Physics"
      );

      if (!motionScores.length) {
        setPerformance({ time: 0, wordProblem: 0, problemSolving: 0 });
        return;
      }

      const normalize = (txt: string | undefined) => txt?.trim().toLowerCase() ?? "";

      const wordProblemScores = motionScores.filter(
        (s) => normalize(s.quizzes?.category) === "word problem" && s.score !== null
      );
      const problemSolvingScores = motionScores.filter(
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

      const validTimes = motionScores.filter((s) => s.time_taken !== null);
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

      console.log("✅ Computed performance (Motion):", newPerformance);
      animateRadarUpdate(newPerformance);
    } catch (err) {
      console.error("Error fetching radar data:", err);
      setPerformance({ time: 0, wordProblem: 0, problemSolving: 0 });
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  // initialize radar
  useEffect(() => {
    setVisible(true);
    void fetchRadarData();
  }, []);

  // ✅ Fix: only initialize chart once
  useEffect(() => {
    if (!radarRef.current) return;
    const ctx = radarRef.current.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 500);
    gradient.addColorStop(0, "rgba(54, 162, 235, 0.32)");
    gradient.addColorStop(1, "rgba(236, 72, 153, 0.32)");

    const chart = new ChartJS(ctx, {
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
          legend: {
            display: true,
            labels: { color: "#111", font: { size: 13, weight: "bold" } },
          },
          title: {
            display: true,
            text: "📊 Uniform Motion in Physics",
            color: "#111",
            font: { size: 18, weight: "bold" },
          },
          datalabels: {
            color: "#000",
            font: { weight: "bold", size: 11 },
            formatter: (val: number) =>
              Number.isInteger(val) ? `${val}%` : `${val.toFixed(1)}%`,
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

    chartInstance.current = chart;

    return () => {
      chart.destroy();
      chartInstance.current = null;
    };
  }, []);

  // ✅ Fix: update chart data reactively when performance changes
  useEffect(() => {
    if (!chartInstance.current) return;
    const chart = chartInstance.current;
    chart.data.datasets[0].data = [
      performance.time,
      performance.wordProblem,
      performance.problemSolving,
    ];
    chart.update();
  }, [performance]);

  const labels = ["⏱ Time", "📘 Word Problem", "🧩 Problem Solving"];

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen>
        <AnimatePresence>
          {visible && (
            <motion.div
              key="motion-radar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "90vh",
              }}
            >
              <motion.h2
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{ fontSize: 22, fontWeight: 700, color: "#222" }}
              >
                🌟 Best Performance Overview
              </motion.h2>

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                {labels.map((label, idx) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.25 + idx * 0.14 }}
                    style={{
                      background: "linear-gradient(90deg, #36A2EB, #EC4899)",
                      padding: "6px 12px",
                      borderRadius: 8,
                      color: "white",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {label}
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                style={{
                  width: "100%",
                  maxWidth: 500,
                  height: 450,
                  background: "white",
                  borderRadius: 16,
                  boxShadow: "0px 8px 20px rgba(0,0,0,0.08)",
                  marginTop: 24,
                  padding: 16,
                }}
              >
                <canvas ref={radarRef} style={{ width: "100%", height: "100%" }} />
              </motion.div>

              <motion.button
                onClick={fetchRadarData}
                disabled={loading}
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: loading ? 1 : 1.03 }}
                style={{
                  padding: "10px 20px",
                  background: loading
                    ? "linear-gradient(90deg, #9CA3AF, #D1D5DB)"
                    : "linear-gradient(90deg, #36A2EB, #EC4899)",
                  color: "white",
                  fontSize: 15,
                  fontWeight: 700,
                  borderRadius: 10,
                  border: "none",
                  marginTop: 24,
                  width: "100%",
                  maxWidth: 200,
                }}
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

export default Motion_Radar;
