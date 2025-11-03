import {
  IonPage,
  IonHeader,
  IonContent,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonItem,
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
  id?: string;
  category?: string;
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

const Arithmetic_Radar: React.FC = () => {
  const radarRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  const [performance, setPerformance] = useState({
    time: 0,
    solving: 0,
    problemSolving: 0,
  });

  const [attempts, setAttempts] = useState<ScoreWithQuizzes[][]>([]);
  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Smooth radar animation
  const animateRadarUpdate = (
    newData: { time: number; solving: number; problemSolving: number },
    duration = 800
  ) => {
    const steps = 30;
    const interval = duration / steps;
    let currentStep = 0;
    const startData = { ...performance };

    const animate = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      setPerformance({
        time: startData.time + (newData.time - startData.time) * progress,
        solving:
          startData.solving + (newData.solving - startData.solving) * progress,
        problemSolving:
          startData.problemSolving +
          (newData.problemSolving - startData.problemSolving) * progress,
      });
      if (currentStep >= steps) clearInterval(animate);
    }, interval);
  };

  // Safe mapper
  const safeMapScore = (r: Record<string, unknown>): ScoreWithQuizzes => {
    const rawQuizzes = r["quizzes"];
    let quizObj: QuizRef | null = null;

    if (rawQuizzes) {
      if (Array.isArray(rawQuizzes) && rawQuizzes.length > 0) {
        const q = rawQuizzes[0] as Record<string, unknown>;
        quizObj = {
          id: q.id ? String(q.id) : undefined,
          category: q.category ? String(q.category) : undefined,
          subject: q.subject ? String(q.subject) : undefined,
        };
      } else if (typeof rawQuizzes === "object") {
        const q = rawQuizzes as Record<string, unknown>;
        quizObj = {
          id: q.id ? String(q.id) : undefined,
          category: q.category ? String(q.category) : undefined,
          subject: q.subject ? String(q.subject) : undefined,
        };
      }
    }

    return {
      id: String(r["id"] ?? ""),
      score:
        r["score"] === undefined || r["score"] === null
          ? null
          : Number(r["score"]),
      time_taken:
        r["time_taken"] === undefined || r["time_taken"] === null
          ? null
          : Number(r["time_taken"]),
      created_at: String(r["created_at"] ?? new Date().toISOString()),
      quiz_id: String(r["quiz_id"] ?? ""),
      quizzes: quizObj,
    };
  };

  const fetchRadarData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setAttempts([]);
        setPerformance({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      const { data, error } = await supabase
        .from("scores")
        .select(
          `id, score, time_taken, created_at, quiz_id, quizzes!quiz_id(id, category, subject)`
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const raw = (data || []) as Record<string, unknown>[];
      const typed: ScoreWithQuizzes[] = raw.map(safeMapScore);

      // Filter by subject
      const arithmeticScores = typed.filter(
        (s) => s.quizzes?.subject === "Arithmetic Sequence"
      );

      // ✅ Dynamic grouping by each pair (Solving + Problem Solving)
      const grouped: ScoreWithQuizzes[][] = [];
      const sorted = arithmeticScores.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      let currentGroup: ScoreWithQuizzes[] = [];

      for (let i = 0; i < sorted.length; i++) {
        const quiz = sorted[i];
        currentGroup.push(quiz);

        const hasSolving = currentGroup.some(
          (s) => s.quizzes?.category === "Solving"
        );
        const hasProblemSolving = currentGroup.some(
          (s) => s.quizzes?.category === "Problem Solving"
        );

        // If both types exist, one full attempt done
        if (hasSolving && hasProblemSolving) {
          grouped.push([...currentGroup]);
          currentGroup = [];
        }
      }

      // Handle remaining unpaired quiz
      if (currentGroup.length > 0) {
        grouped.push([...currentGroup]);
      }

      setAttempts(grouped);

      if (grouped.length > 0) {
        updateRadarForAttempt(0, grouped);
        setSelectedAttemptIndex(0);
      } else {
        setPerformance({ time: 0, solving: 0, problemSolving: 0 });
      }
    } catch (err) {
      console.error("Error fetching radar data:", err);
      setAttempts([]);
      setPerformance({ time: 0, solving: 0, problemSolving: 0 });
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  // ✅ Compute radar data
  const updateRadarForAttempt = (index: number, data = attempts) => {
    const target = data[index];
    if (!target || target.length === 0) {
      animateRadarUpdate({ time: 0, solving: 0, problemSolving: 0 });
      return;
    }

    const avgTime =
      (target.reduce((sum, s) => sum + (s.time_taken || 0), 0) || 0) /
      target.length;
    const timePercent = Math.max(
      0,
      Math.min(100, parseFloat((((MAX_TIME - avgTime) / MAX_TIME) * 100).toFixed(2)))
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
            (solvingScores.length * MAX_SCORE)) * 100
        : 0;

    const avgProblemSolving =
      problemScores.length > 0
        ? (problemScores.reduce((sum, s) => sum + (s.score || 0), 0) / 
            (problemScores.length * MAX_SCORE)) * 100
        : 0;

    animateRadarUpdate({
      time: timePercent,
      solving: Number(avgSolving.toFixed(2)),
      problemSolving: Number(avgProblemSolving.toFixed(2)),
    });
  };

  useEffect(() => {
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

    chartInstance.current = new ChartJS(ctx, {
      type: "radar",
      data: {
        labels: ["⏱ Time", "🧮 Solving", "🧩 Problem Solving"],
        datasets: [
          {
            label: "My Performance (Arithmetic Sequence)",
            data: [
              performance.time,
              performance.solving,
              performance.problemSolving,
            ],
            fill: true,
            backgroundColor: "rgba(54,162,235,0.28)",
            borderColor: "rgb(54,162,235)",
            borderWidth: 3,
            pointBackgroundColor: "rgb(236,72,153)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
          datalabels: {
            color: "#000",
            font: { weight: "bold" },
            formatter: (val: number) => `${Math.round(val)}%`,
          },
        },
      },
      plugins: [ChartDataLabels],
    });

    return () => chartInstance.current?.destroy();
  }, [performance]);

  // Helper for ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen>
        <AnimatePresence>
          <motion.div
            key="radar-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ padding: 16, textAlign: "center" }}
          >
            <h2 style={{ margin: 0 }}>
              📊 Arithmetic Sequence Progress Overview
            </h2>

            <div style={{ marginTop: 12 }}>
              {attempts.length > 0 ? (
                <IonItem
                  style={{ margin: "10px auto", width: "90%", maxWidth: 400 }}
                >
                  <IonLabel>Attempt</IonLabel>
                  <IonSelect
                    value={selectedAttemptIndex}
                    onIonChange={(e) => {
                      const idx = Number(e.detail.value);
                      setSelectedAttemptIndex(idx);
                      updateRadarForAttempt(idx);
                    }}
                  >
                    {attempts.map((_, idx) => (
                      <IonSelectOption key={idx} value={idx}>
                        {idx + 1}
                        {getOrdinal(idx + 1)} Take
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
              ) : (
                <p style={{ marginTop: 12 }}>No attempts found yet.</p>
              )}
            </div>

            <div
              style={{
                width: "100%",
                maxWidth: 560,
                height: 420,
                margin: "20px auto",
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                padding: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <canvas ref={radarRef} style={{ width: "100%", height: "100%" }} />
            </div>

            <motion.button
              onClick={fetchRadarData}
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              style={{
                marginTop: 8,
                background: loading
                  ? "#9CA3AF"
                  : "linear-gradient(90deg,#36A2EB,#EC4899)",
                color: "#fff",
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                cursor: loading ? "default" : "pointer",
                fontWeight: 700,
              }}
            >
              {loading ? "Refreshing..." : "🔄 Refresh Data"}
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </IonContent>
    </IonPage>
  );
};

export default Arithmetic_Radar;
