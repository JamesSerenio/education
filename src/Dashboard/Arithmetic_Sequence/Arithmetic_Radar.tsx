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

// 15 questions total (5 easy, 5 average, 5 difficult)
const MAX_SCORE = 5;
const MAX_TIME = 525; // total max time (15 + 30 + 60) × 5 = 525 seconds

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
    solving: 0,
    problemSolving: 0,
  });

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const mapToScoreWithQuizzes = (rawData: Record<string, unknown>): ScoreWithQuizzes => {
    const quizzesRaw = rawData["quizzes"] as Record<string, unknown> | undefined;
    return {
      id: String(rawData["id"] ?? ""),
      score: rawData["score"] === undefined || rawData["score"] === null
        ? null
        : Number(rawData["score"]),
      time_taken: rawData["time_taken"] === undefined || rawData["time_taken"] === null
        ? null
        : Number(rawData["time_taken"]),
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
    newData: { time: number; solving: number; problemSolving: number },
    duration = 800
  ) => {
    const steps = 30;
    const interval = duration / steps;
    setPerformance({ time: 0, solving: 0, problemSolving: 0 });
    let currentStep = 0;
    const animate = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      setPerformance({
        time: newData.time * progress,
        solving: newData.solving * progress,
        problemSolving: newData.problemSolving * progress,
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
        setPerformance({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      const { data: allScores, error: scoresError } = await supabase
        .from("scores")
        .select(`id, score, time_taken, created_at, quiz_id, quizzes!quiz_id(id, category, subject)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (scoresError) {
        console.error("Error fetching scores:", scoresError);
        setPerformance({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      const rawArray = (allScores ?? []) as Record<string, unknown>[];
      const typedScores: ScoreWithQuizzes[] = rawArray.map(mapToScoreWithQuizzes);

      const arithmeticScores = typedScores.filter(
        (s) => s.quizzes?.subject?.toLowerCase() === "arithmetic sequence"
      );

      if (!arithmeticScores.length) {
        setPerformance({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      // total time spent (sum of all quizzes)
      const totalTime = arithmeticScores.reduce(
        (acc, s) => acc + (s.time_taken ?? 0),
        0
      );

      // average solving score
      const solvingScores = arithmeticScores.filter(
        (s) => s.quizzes?.category?.toLowerCase() === "solving"
      );
      const avgSolving =
        solvingScores.length > 0
          ? solvingScores.reduce((a, s) => a + (s.score ?? 0), 0) /
            solvingScores.length
          : 0;

      // average problem solving score
      const problemSolvingScores = arithmeticScores.filter(
        (s) => s.quizzes?.category?.toLowerCase() === "problem solving"
      );
      const avgProblemSolving =
        problemSolvingScores.length > 0
          ? problemSolvingScores.reduce((a, s) => a + (s.score ?? 0), 0) /
            problemSolvingScores.length
          : 0;

      // convert to %
      const timePercent = ((MAX_TIME - totalTime) / MAX_TIME) * 100;

      const newPerformance = {
        time: Math.max(0, Math.min(100, parseFloat(timePercent.toFixed(2)))),
        solving: Math.floor((avgSolving / MAX_SCORE) * 100),
        problemSolving: Math.floor((avgProblemSolving / MAX_SCORE) * 100),
      };

      animateRadarUpdate(newPerformance);
    } catch (err) {
      console.error("Error fetching radar data:", err);
      setPerformance({ time: 0, solving: 0, problemSolving: 0 });
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
        labels: ["⏱ Time", "🧩 Problem Solving", "🧮 Solving"],
        datasets: [
          {
            label: "🏆 Best Performance (Arithmetic Sequence)",
            data: [performance.time, performance.problemSolving, performance.solving],
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
          title: {
            display: true,
            text: "📊 Arithmetic Sequence Performance",
            color: "#111",
            font: { size: 18, weight: "bold" },
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

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen>
        <AnimatePresence>
          {visible && (
            <motion.div
              key="radar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                padding: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                🏅 Arithmetic Sequence Overview
              </motion.h2>
              <div style={{ width: "100%", maxWidth: 480, height: 450 }}>
                <canvas ref={radarRef} />
              </div>

              <motion.button
                onClick={fetchRadarData}
                disabled={loading}
                whileTap={{ scale: 0.95 }}
                style={{
                  marginTop: 20,
                  background: "linear-gradient(90deg, #36A2EB, #EC4899)",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 8,
                  fontWeight: 700,
                }}
              >
                {loading ? "Refreshing..." : "🔄 Refresh"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </IonContent>
    </IonPage>
  );
};

export default Arithmetic_Radar;
