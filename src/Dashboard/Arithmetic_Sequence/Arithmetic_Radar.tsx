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

interface Quiz {
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
  quizzes: Quiz | null;
}

const Arithmetic_Radar: React.FC = () => {
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

  const [loading, setLoading] = useState(false);

  const normalize = (txt?: string) => txt?.trim().toLowerCase() ?? "";

  const mapToScoreWithQuizzes = (raw: Record<string, unknown>): ScoreWithQuizzes => {
    const quizData = raw["quizzes"] as Record<string, unknown> | undefined;
    return {
      id: String(raw["id"] ?? ""),
      score: raw["score"] == null ? null : Number(raw["score"]),
      time_taken: raw["time_taken"] == null ? null : Number(raw["time_taken"]),
      created_at: String(raw["created_at"] ?? new Date().toISOString()),
      quiz_id: String(raw["quiz_id"] ?? ""),
      quizzes: quizData
        ? {
            id: String(quizData["id"] ?? ""),
            category: String(quizData["category"] ?? ""),
            subject: quizData["subject"] ? String(quizData["subject"]) : undefined,
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
    let step = 0;
    const start = { ...performance };

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setPerformance({
        time: start.time + (newData.time - start.time) * progress,
        wordProblem:
          start.wordProblem + (newData.wordProblem - start.wordProblem) * progress,
        problemSolving:
          start.problemSolving + (newData.problemSolving - start.problemSolving) * progress,
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
  };

  const fetchRadarData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("scores")
        .select(
          `id, score, time_taken, created_at, quiz_id, quizzes!quiz_id(id, category, subject)`
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) return;

      const mapped = (data ?? []).map(mapToScoreWithQuizzes);

      const arithmeticScores = mapped.filter(
        (s) => normalize(s.quizzes?.subject) === "arithmetic sequence"
      );

      const wordProblem = arithmeticScores.filter(
        (s) => normalize(s.quizzes?.category) === "word problem" && s.score !== null
      );
      const problemSolving = arithmeticScores.filter(
        (s) => normalize(s.quizzes?.category) === "problem solving" && s.score !== null
      );

      const bestWord = wordProblem.length > 0 ? Math.max(...wordProblem.map((s) => s.score ?? 0)) : 0;
      const bestProblem = problemSolving.length > 0 ? Math.max(...problemSolving.map((s) => s.score ?? 0)) : 0;

      const bestTimeRecord = arithmeticScores.filter((s) => s.time_taken !== null);
      const bestTime =
        bestTimeRecord.length > 0
          ? Math.min(...bestTimeRecord.map((s) => s.time_taken ?? MAX_TIME))
          : MAX_TIME;

      const newData = {
        time: ((MAX_TIME - bestTime) / MAX_TIME) * 100,
        wordProblem: (bestWord / MAX_SCORE) * 100,
        problemSolving: (bestProblem / MAX_SCORE) * 100,
      };

      setCategoryPercent(newData);
      animateRadarUpdate(newData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderRadarChart = () => {
    if (!radarRef.current) return;
    const ctx = radarRef.current.getContext("2d");
    if (!ctx) return;

    chartInstance.current?.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(101, 163, 13, 0.35)");
    gradient.addColorStop(1, "rgba(234, 179, 8, 0.35)");

    chartInstance.current = new ChartJS(ctx, {
      type: "radar",
      data: {
        labels: ["⏱ Time", "📘 Word Problem", "🧩 Problem Solving"],
        datasets: [
          {
            label: "🏆 Best Performance",
            data: [performance.time, performance.wordProblem, performance.problemSolving],
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
          legend: { display: true },
          title: {
            display: true,
            text: "📊 Arithmetic Sequence Performance",
            font: { size: 18, weight: "bold" },
          },
          datalabels: {
            color: "#000",
            font: { size: 12, weight: "bold" },
            formatter: (val: number) => `${val.toFixed(1)}%`,
          },
        },
        scales: {
          r: {
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: { display: false },
            pointLabels: { color: "#111", font: { size: 13 } },
          },
        },
      },
      plugins: [ChartDataLabels],
    });
  };

  useEffect(() => {
    fetchRadarData();
  }, []);

  useEffect(() => {
    renderRadarChart();
  }, [performance]);

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ padding: 20 }}
          >
            <h2>🏅 Best Performance Overview</h2>
            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 20 }}>
              <div style={{ textAlign: "center" }}>
                <strong>⏱ Time</strong>
                <br />
                {categoryPercent.time.toFixed(1)}%
              </div>
              <div style={{ textAlign: "center" }}>
                <strong>📘 Word Problem</strong>
                <br />
                {categoryPercent.wordProblem.toFixed(1)}%
              </div>
              <div style={{ textAlign: "center" }}>
                <strong>🧩 Problem Solving</strong>
                <br />
                {categoryPercent.problemSolving.toFixed(1)}%
              </div>
            </div>

            <canvas ref={radarRef} style={{ height: 350 }} />

            <motion.button
              onClick={fetchRadarData}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
              style={{ marginTop: 20 }}
            >
              {loading ? "🔄 Refreshing..." : "🔄 Refresh"}
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </IonContent>
    </IonPage>
  );
};

export default Arithmetic_Radar;
