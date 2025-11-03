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
import { supabase } from "../utils/supabaseClient";

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

interface UserScore {
  time: number;
  solving: number;
  problemSolving: number;
}

interface Quiz {
  id: string;
  category: string;
  subject: string;
}

interface ScoreWithQuizzes {
  id: string;
  score: number | null;
  time_taken: number | null;
  created_at: string;
  quiz_id: string;
  quizzes: Quiz | null;
}

const AdminRadar: React.FC = () => {
  const radarRefArithmetic = useRef<HTMLCanvasElement | null>(null);
  const radarRefPhysics = useRef<HTMLCanvasElement | null>(null);
  const chartArithmetic = useRef<ChartJS | null>(null);
  const chartPhysics = useRef<ChartJS | null>(null);

  const [arithmeticScore, setArithmeticScore] = useState<UserScore>({
    time: 0,
    solving: 0,
    problemSolving: 0,
  });

  const [physicsScore, setPhysicsScore] = useState<UserScore>({
    time: 0,
    solving: 0,
    problemSolving: 0,
  });

  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  // 🔹 Helper
  const mapToScoreWithQuizzes = (raw: Record<string, unknown>): ScoreWithQuizzes => {
    const quiz = raw.quizzes as Record<string, unknown> | null;
    return {
      id: String(raw.id ?? ""),
      score: raw.score === null ? null : Number(raw.score),
      time_taken: raw.time_taken === null ? null : Number(raw.time_taken),
      created_at: String(raw.created_at ?? new Date().toISOString()),
      quiz_id: String(raw.quiz_id ?? ""),
      quizzes: quiz
        ? {
            id: String(quiz.id ?? ""),
            category: String(quiz.category ?? ""),
            subject: String(quiz.subject ?? ""),
          }
        : null,
    };
  };

  // 📊 Fetch per subject
  const fetchSubjectData = async (subject: string): Promise<UserScore> => {
    try {
      const { data, error } = await supabase
        .from("scores")
        .select(`id, score, time_taken, created_at, quiz_id, quizzes!quiz_id (id, category, subject)`)
        .eq("quizzes.subject", subject);

      if (error) throw error;

      const mapped: ScoreWithQuizzes[] = (data || []).map(mapToScoreWithQuizzes);
      if (!mapped.length) return { time: 0, solving: 0, problemSolving: 0 };

      const avgTime =
        mapped.reduce((sum, s) => sum + (s.time_taken ?? 0), 0) / mapped.length;
      const timePercent = Math.max(0, Math.min(100, ((MAX_TIME - avgTime) / MAX_TIME) * 100));

      const solvingScores = mapped.filter(
        (s) => s.quizzes?.category.toLowerCase() === "solving" && s.score !== null
      );
      const problemScores = mapped.filter(
        (s) => s.quizzes?.category.toLowerCase() === "problem solving" && s.score !== null
      );

      const solvingPercent =
        solvingScores.length > 0
          ? (solvingScores.reduce((sum, s) => sum + (s.score ?? 0), 0) /
              solvingScores.length /
              MAX_SCORE) *
            100
          : 0;

      const problemSolvingPercent =
        problemScores.length > 0
          ? (problemScores.reduce((sum, s) => sum + (s.score ?? 0), 0) /
              problemScores.length /
              MAX_SCORE) *
            100
          : 0;

      return {
        time: parseFloat(timePercent.toFixed(2)),
        solving: parseFloat(solvingPercent.toFixed(2)),
        problemSolving: parseFloat(problemSolvingPercent.toFixed(2)),
      };
    } catch (err) {
      console.error(`Error fetching ${subject}:`, err);
      return { time: 0, solving: 0, problemSolving: 0 };
    }
  };

  // 🌀 Animate radar updates
  const animateRadarUpdate = (
    setter: React.Dispatch<React.SetStateAction<UserScore>>,
    newScore: UserScore,
    duration = 800
  ) => {
    const steps = 30;
    const interval = duration / steps;
    let currentStep = 0;
    const start = { time: 0, solving: 0, problemSolving: 0 };

    const animate = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      setter({
        time: start.time + (newScore.time - start.time) * progress,
        solving: start.solving + (newScore.solving - start.solving) * progress,
        problemSolving:
          start.problemSolving +
          (newScore.problemSolving - start.problemSolving) * progress,
      });
      if (currentStep >= steps) clearInterval(animate);
    }, interval);
  };

  // 🔁 Load both
  const fetchAllData = async () => {
    setLoading(true);
    const arithmetic = await fetchSubjectData("Arithmetic Sequence");
    const physics = await fetchSubjectData("Uniform Motion in Physics");
    animateRadarUpdate(setArithmeticScore, arithmetic);
    animateRadarUpdate(setPhysicsScore, physics);
    setTimeout(() => setLoading(false), 600);
  };

  // 🧭 Chart creation
  const createRadarChart = (
    ctx: CanvasRenderingContext2D,
    data: UserScore,
    title: string
  ): ChartJS => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(54, 162, 235, 0.32)");
    gradient.addColorStop(1, "rgba(236, 72, 153, 0.32)");

    return new ChartJS(ctx, {
      type: "radar",
      data: {
        labels: ["⏱ Time", "🧩 Problem Solving", "🧮 Solving"],
        datasets: [
          {
            label: `${title} (All Students)`,
            data: [data.time, data.problemSolving, data.solving],
            fill: true,
            backgroundColor: gradient,
            borderColor: "rgb(54,162,235)",
            borderWidth: 3,
            pointBackgroundColor: "rgb(236,72,153)",
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
            text: title,
            color: "#111",
            font: { size: 18, weight: "bold" },
          },
          datalabels: {
            color: "#000",
            font: { size: 12, weight: "bold" },
            formatter: (v: number) => `${v.toFixed(1)}%`,
          },
        },
        scales: {
          r: { suggestedMin: 0, suggestedMax: 100, ticks: { display: false } },
        },
      },
      plugins: [ChartDataLabels],
    });
  };

  useEffect(() => {
    if (!radarRefArithmetic.current || !radarRefPhysics.current) return;
    const ctxA = radarRefArithmetic.current.getContext("2d");
    const ctxP = radarRefPhysics.current.getContext("2d");
    if (!ctxA || !ctxP) return;

    chartArithmetic.current?.destroy();
    chartPhysics.current?.destroy();

    chartArithmetic.current = createRadarChart(
      ctxA,
      arithmeticScore,
      "📘 Arithmetic Sequence"
    );
    chartPhysics.current = createRadarChart(
      ctxP,
      physicsScore,
      "⚛️ Uniform Motion in Physics"
    );

    return () => {
      chartArithmetic.current?.destroy();
      chartPhysics.current?.destroy();
    };
  }, [arithmeticScore, physicsScore]);

  useEffect(() => {
    setVisible(true);
    void fetchAllData();
  }, []);

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen>
        <AnimatePresence>
          {visible && (
            <motion.div
              key="admin-radar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 30,
                padding: 20,
              }}
            >
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                style={{ fontSize: 22, fontWeight: 700, color: "#222" }}
              >
                📊 All Students Performance Overview
              </motion.h2>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 20,
                  width: "100%",
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  style={{
                    width: "100%",
                    maxWidth: 480,
                    height: 420,
                    background: "white",
                    borderRadius: 16,
                    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                    padding: 16,
                  }}
                >
                  <canvas ref={radarRefArithmetic} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7 }}
                  style={{
                    width: "100%",
                    maxWidth: 480,
                    height: 420,
                    background: "white",
                    borderRadius: 16,
                    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                    padding: 16,
                  }}
                >
                  <canvas ref={radarRefPhysics} />
                </motion.div>
              </div>

              <motion.button
                onClick={fetchAllData}
                disabled={loading}
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: loading ? 1 : 1.03 }}
                style={{
                  padding: "10px 20px",
                  background: loading
                    ? "linear-gradient(90deg,#9CA3AF,#D1D5DB)"
                    : "linear-gradient(90deg,#6366F1,#EC4899)",
                  color: "white",
                  fontSize: 15,
                  fontWeight: 700,
                  borderRadius: 10,
                  border: "none",
                  width: "100%",
                  maxWidth: 200,
                }}
              >
                {loading ? "🔄 Refreshing..." : "🔄 Refresh Charts"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </IonContent>
    </IonPage>
  );
};

export default AdminRadar;
