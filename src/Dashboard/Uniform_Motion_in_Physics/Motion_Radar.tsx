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
    const quizzesRaw = rawData["quizzes"] as Record<string, unknown> | null;
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

      const rawArray = (allScores ?? []) as Record<string, unknown>[];
      const typedScores = rawArray.map(mapToScoreWithQuizzes);
      setScores(typedScores);

      // ✅ Only change the subject here
      const motionScores = typedScores.filter(
        (s) => s.quizzes?.subject?.trim().toLowerCase() === "uniform motion in physics"
      );

      const normalize = (txt: string | undefined) => txt?.trim().toLowerCase() ?? "";

      const wordProblemScores = motionScores.filter(
        (s) => normalize(s.quizzes?.category) === "word problem" && s.score !== null
      );
      const problemSolvingScores = motionScores.filter(
        (s) => normalize(s.quizzes?.category) === "problem solving" && s.score !== null
      );

      const bestWordProblem = wordProblemScores.length > 0
        ? Math.max(...wordProblemScores.map((s) => s.score ?? 0))
        : 0;
      const bestProblemSolving = problemSolvingScores.length > 0
        ? Math.max(...problemSolvingScores.map((s) => s.score ?? 0))
        : 0;

      const validTimes = motionScores.filter((s) => s.time_taken !== null);
      const bestTime = validTimes.length > 0
        ? Math.min(...validTimes.map((s) => s.time_taken ?? MAX_TIME))
        : MAX_TIME;

      const timePercent = ((MAX_TIME - bestTime) / MAX_TIME) * 100;

      const newPerformance = {
        time: Math.max(0, Math.min(100, parseFloat(timePercent.toFixed(2)))),
        wordProblem: (bestWordProblem / MAX_SCORE) * 100,
        problemSolving: (bestProblemSolving / MAX_SCORE) * 100,
      };

      setCategoryPercent(newPerformance);
      animateRadarUpdate(newPerformance);
    } catch (err) {
      console.error("Error fetching radar data:", err);
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  useEffect(() => {
    setVisible(true);
    void fetchRadarData();
  }, []);

  useEffect(() => {
    if (!radarRef.current || selectedCategory) return;
    const ctx = radarRef.current.getContext("2d");
    if (!ctx) return;

    chartInstance.current?.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 500);
    gradient.addColorStop(0, "rgba(54, 162, 235, 0.35)");
    gradient.addColorStop(1, "rgba(236, 72, 153, 0.35)");

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
            borderColor: "#36a2eb",
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
          legend: { display: true },
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

    return () => chartInstance.current?.destroy();
  }, [performance, selectedCategory]);

  const getCategoryRecords = () => {
    const normalize = (txt: string | undefined) => txt?.trim().toLowerCase() ?? "";
    if (selectedCategory === "time") {
      return scores.filter(
        (s) => s.quizzes?.subject?.trim().toLowerCase() === "uniform motion in physics"
      );
    }
    return scores.filter(
      (s) =>
        s.quizzes?.subject?.trim().toLowerCase() === "uniform motion in physics" &&
        normalize(s.quizzes?.category) === selectedCategory
    );
  };

  const recordPercent = (record: ScoreWithQuizzes) => {
    if (selectedCategory === "time") {
      return record.time_taken ? ((MAX_TIME - record.time_taken) / MAX_TIME) * 100 : 0;
    }
    if (selectedCategory === "word problem" || selectedCategory === "problem solving") {
      return record.score ? (record.score / MAX_SCORE) * 100 : 0;
    }
    return 0;
  };

  const labels = ["⏱ Time", "📘 Word Problem", "🧩 Problem Solving"];

  const handleLabelClick = (label: string) => {
    const categoryMap: Record<string, string> = {
      "⏱ Time": "time",
      "📘 Word Problem": "word problem",
      "🧩 Problem Solving": "problem solving",
    };
    setSelectedCategory(categoryMap[label]);
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
                  <motion.h2
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="radar-title"
                  >
                    🏅 Best Performance Overview
                  </motion.h2>

                  <div className="radar-labels">
                    {labels.map((label) => (
                      <motion.div
                        key={label}
                        className="radar-label"
                        onClick={() => handleLabelClick(label)}
                      >
                        {label}
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="radar-card"
                  >
                    <canvas ref={radarRef} />
                  </motion.div>

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
                  <motion.h2 className="radar-title">
                    📘 {selectedCategory.toUpperCase()} RECORDS
                  </motion.h2>

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
                          <strong>Score:</strong> {record.score ?? "N/A"} / {MAX_SCORE}<br />
                          <strong>Time Taken:</strong>{" "}
                          {record.time_taken ? `${record.time_taken}s` : "N/A"}<br />
                          <strong>Percent:</strong> {recordPercent(record).toFixed(1)}%<br />
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

export default Motion_Radar;
