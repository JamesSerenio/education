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

  // safer map from unknown-ish data coming from Supabase
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
            subject: quizzesRaw["subject"] ? String(quizzesRaw["subject"]) : undefined,
          }
        : null,
    };
  };

  const fetchRadarData = async () => {
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
        .select(
          `id, score, time_taken, created_at, quiz_id, quizzes!quiz_id(id, category, subject)`
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (scoresError) {
        console.error("Error fetching scores:", scoresError);
        setPerformance({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      const rawArray = (allScores ?? []) as Record<string, unknown>[];
      const typedScores: ScoreWithQuizzes[] = rawArray.map(mapToScoreWithQuizzes);

      if (!typedScores.length) {
        setPerformance({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      const arithmeticScores = typedScores.filter(
        (s) => s.quizzes?.subject === "Arithmetic Sequence"
      );

      if (!arithmeticScores.length) {
        setPerformance({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      const avgTime =
        arithmeticScores.reduce((sum, s) => sum + (s.time_taken || 0), 0) /
        arithmeticScores.length;

      const timeRaw = ((MAX_TIME - avgTime) / MAX_TIME) * 100;
      const timePercent = Math.max(0, Math.min(100, parseFloat(timeRaw.toFixed(2))));

      const solvingScores = arithmeticScores.filter(
        (s) => s.quizzes?.category === "Solving" && s.score !== null
      );
      const problemSolvingScores = arithmeticScores.filter(
        (s) => s.quizzes?.category === "Problem Solving" && s.score !== null
      );

      const avgSolving =
        solvingScores.reduce((sum, s) => sum + (s.score || 0), 0) / (solvingScores.length || 1);
      const avgProblemSolving =
        problemSolvingScores.reduce((sum, s) => sum + (s.score || 0), 0) /
        (problemSolvingScores.length || 1);

      setPerformance({
        time: timePercent,
        solving: Math.floor((avgSolving / MAX_SCORE) * 100),
        problemSolving: Math.floor((avgProblemSolving / MAX_SCORE) * 100),
      });
    } catch (err) {
      console.error("Error fetching radar data:", err);
      setPerformance({ time: 0, solving: 0, problemSolving: 0 });
    }
  };

  // mount: show and load
  useEffect(() => {
    setVisible(true);
    void fetchRadarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // redraw chart on performance change
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
            label: "✨ My Performance (Arithmetic Sequence)",
            data: [performance.time, performance.problemSolving, performance.solving],
            fill: true,
            backgroundColor: gradient,
            borderColor: "rgb(54, 162, 235)",
            borderWidth: 3,
            pointBackgroundColor: "rgb(236, 72, 153)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgb(236, 72, 153)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: "easeOutCirc" },
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
            formatter: (val: number) =>
              val % 1 !== 0 ? `${val.toFixed(2)}%` : `${Math.round(val)}%`,
          },
        },
        scales: {
          r: {
            angleLines: { color: "rgba(156, 163, 175, 0.3)" },
            grid: { color: "rgba(209, 213, 219, 0.3)" },
            pointLabels: { color: "#111", font: { size: 12, weight: "bold" } },
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

  // labels (we'll animate each with increasing delay)
  const labels = ["⏱ Time", "🧩 Problem Solving", "🧮 Solving"];

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen>
        <AnimatePresence>
          {visible && (
            <motion.div
              key="radar-root"
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
              {/* Title - small delay */}
              <motion.h2
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                style={{ fontSize: 22, fontWeight: 700, color: "#222", margin: 0 }}
              >
                📈 Performance Overview
              </motion.h2>

              {/* Label badges - staggered using index-based delay */}
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

              {/* Chart card - appears after the labels */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
                style={{
                  width: "100%",
                  maxWidth: 500,
                  height: 450,
                  background: "white",
                  borderRadius: 16,
                  boxShadow: "0px 8px 20px rgba(0,0,0,0.08)",
                  marginTop: 24,
                  padding: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <canvas ref={radarRef} style={{ width: "100%", height: "100%" }} />
              </motion.div>

              {/* Refresh button - small delay after chart */}
              <motion.button
                onClick={fetchRadarData}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.03 }}
                style={{
                  padding: "10px 20px",
                  background: "linear-gradient(90deg, #36A2EB, #EC4899)",
                  color: "white",
                  fontSize: 15,
                  fontWeight: 700,
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  marginTop: 24,
                  width: "100%",
                  maxWidth: 200,
                }}
              >
                🔄 Refresh
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </IonContent>
    </IonPage>
  );
};

export default Arithmetic_Radar;
