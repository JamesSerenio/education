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
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<ScoreWithQuizzes[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

      if (error) {
        console.error(error);
        return;
      }

      const mapped = (data ?? []).map(mapToScoreWithQuizzes);
      setScores(mapped);

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
        time: Math.max(0, Math.min(100, ((MAX_TIME - bestTime) / MAX_TIME) * 100)),
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

  useEffect(() => {
    setVisible(true);
    fetchRadarData();
  }, []);

  useEffect(() => {
    if (!radarRef.current || selectedCategory) return;
    const ctx = radarRef.current.getContext("2d");
    if (!ctx) return;

    chartInstance.current?.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 500);
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
        scales: {
          r: {
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: {
              display: true,
              callback: (val) => `${val}%`, // ✅ Show % on scale
            },
            grid: { color: "rgba(0,0,0,0.1)" },
            pointLabels: { color: "#111", font: { size: 13 } },
          },
        },
        plugins: {
          legend: { display: true },
          title: {
            display: true,
            text: "📊 Arithmetic Sequence Performance",
            color: "#111",
            font: { size: 18, weight: "bold" },
          },
          datalabels: {
            color: "#111",
            font: { size: 12, weight: "bold" },
            formatter: (val: number) => `${val.toFixed(1)}%`, // ✅ Show percent at each point
          },
        },
      },
      plugins: [ChartDataLabels],
    });

    return () => chartInstance.current?.destroy();
  }, [performance, selectedCategory]);

  const labels = ["⏱ Time", "📘 Word Problem", "🧩 Problem Solving"];
  const handleLabelClick = (label: string) => {
    const map: Record<string, string> = {
      "⏱ Time": "time",
      "📘 Word Problem": "word problem",
      "🧩 Problem Solving": "problem solving",
    };
    setSelectedCategory(map[label]);
  };

  const getCategoryRecords = () => {
    if (selectedCategory === "time") {
      return scores.filter(
        (s) => normalize(s.quizzes?.subject) === "arithmetic sequence"
      );
    }
    return scores.filter(
      (s) =>
        normalize(s.quizzes?.subject) === "arithmetic sequence" &&
        normalize(s.quizzes?.category) === selectedCategory
    );
  };

  const recordPercent = (record: ScoreWithQuizzes) => {
    if (selectedCategory === "time") {
      return record.time_taken ? ((MAX_TIME - record.time_taken) / MAX_TIME) * 100 : 0;
    }
    return record.score ? (record.score / MAX_SCORE) * 100 : 0;
  };

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
              {!selectedCategory ? (
                <>
                  <h2 className="radar-title">🏅 Best Performance Overview</h2>

                  <div className="radar-labels">
                    {labels.map((label) => (
                      <div
                        key={label}
                        className="radar-label"
                        onClick={() => handleLabelClick(label)}
                      >
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="radar-card">
                    <canvas ref={radarRef} />
                  </div>

                  <motion.button
                    onClick={fetchRadarData}
                    disabled={loading}
                    whileTap={{ scale: 0.96 }}
                    className={`radar-refresh-btn ${loading ? "loading" : ""}`}
                  >
                    {loading ? "🔄 Refreshing..." : "🔄 Refresh"}
                  </motion.button>
                </>
              ) : (
                <>
                  <h2 className="radar-title">
                    📘 {selectedCategory.toUpperCase()} RECORDS
                  </h2>

                  <p style={{ fontWeight: "bold", marginBottom: "12px" }}>
                    Total Percent:{" "}
                    {selectedCategory === "time"
                      ? categoryPercent.time.toFixed(1)
                      : selectedCategory === "word problem"
                      ? categoryPercent.wordProblem.toFixed(1)
                      : categoryPercent.problemSolving.toFixed(1)}
                    %
                  </p>

                  <div style={{ textAlign: "left", marginTop: "15px" }}>
                    {getCategoryRecords().length > 0 ? (
                      getCategoryRecords().map((record) => (
                        <div
                          key={record.id}
                          style={{
                            background: "#f8fafc",
                            padding: "10px",
                            borderRadius: "10px",
                            marginBottom: "8px",
                          }}
                        >
                          <strong>Score:</strong> {record.score ?? "N/A"} / {MAX_SCORE}
                          <br />
                          <strong>Time Taken:</strong>{" "}
                          {record.time_taken ? `${record.time_taken}s` : "N/A"}
                          <br />
                          <strong>Percent:</strong> {recordPercent(record).toFixed(1)}%
                          <br />
                          <small>{new Date(record.created_at).toLocaleString()}</small>
                        </div>
                      ))
                    ) : (
                      <p>No records found.</p>
                    )}
                  </div>

                  <motion.button
                    onClick={() => setSelectedCategory(null)}
                    whileTap={{ scale: 0.95 }}
                    className="radar-refresh-btn"
                    style={{ marginTop: "20px" }}
                  >
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

export default Arithmetic_Radar;
