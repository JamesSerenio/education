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

interface ScoreWithQuiz {
  id: string;
  score: number | null;
  time_taken: number | null;
  created_at: string;
  quiz_id: string;
  quizzes: QuizRef | null;
}

interface UserPerformance {
  time: number;
  wordProblem: number;
  problemSolving: number;
}

const Motion_Radar: React.FC = () => {
  const radarRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<ChartJS | null>(null);
  const [performance, setPerformance] = useState<UserPerformance>({
    time: 0,
    wordProblem: 0,
    problemSolving: 0,
  });
  const [loading, setLoading] = useState(false);

  // 🔹 Map data from Supabase
  const mapScore = (raw: Record<string, unknown>): ScoreWithQuiz => {
    const q = raw["quizzes"] as Record<string, unknown> | null;
    return {
      id: String(raw["id"] ?? ""),
      score: raw["score"] ? Number(raw["score"]) : null,
      time_taken: raw["time_taken"] ? Number(raw["time_taken"]) : null,
      created_at: String(raw["created_at"] ?? new Date().toISOString()),
      quiz_id: String(raw["quiz_id"] ?? ""),
      quizzes: q
        ? {
            id: String(q["id"] ?? ""),
            subject: String(q["subject"] ?? ""),
            category: String(q["category"] ?? ""),
          }
        : null,
    };
  };

  // 🔍 Fetch user performance (only logged-in user)
  const fetchUserPerformance = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("No user found:", userError?.message);
        setPerformance({ time: 0, wordProblem: 0, problemSolving: 0 });
        return;
      }

      const { data, error } = await supabase
        .from("scores")
        .select(
          `id, score, time_taken, created_at, quiz_id, quizzes!inner(id, subject, category)`
        )
        .eq("user_id", user.id)
        .eq("quizzes.subject", "Uniform Motion in Physics")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const scores: ScoreWithQuiz[] = (data || []).map(mapScore);

      if (scores.length === 0) {
        setPerformance({ time: 0, wordProblem: 0, problemSolving: 0 });
        return;
      }

      // Separate by category
      const wordProblems = scores.filter(
        (s) => s.quizzes?.category === "Word Problem" && s.score !== null
      );
      const problemSolvings = scores.filter(
        (s) => s.quizzes?.category === "Problem Solving" && s.score !== null
      );

      // Average time (lower = better)
      const avgTime =
        scores.reduce((sum, s) => sum + (s.time_taken ?? 0), 0) /
        scores.length;

      const timePercent = Math.max(
        0,
        Math.min(100, ((MAX_TIME - avgTime) / MAX_TIME) * 100)
      );

      const wordProblemPercent =
        wordProblems.length > 0
          ? (wordProblems.reduce((a, s) => a + (s.score ?? 0), 0) /
              wordProblems.length /
              MAX_SCORE) *
            100
          : 0;

      const problemSolvingPercent =
        problemSolvings.length > 0
          ? (problemSolvings.reduce((a, s) => a + (s.score ?? 0), 0) /
              problemSolvings.length /
              MAX_SCORE) *
            100
          : 0;

      const newPerf = {
        time: parseFloat(timePercent.toFixed(2)),
        wordProblem: parseFloat(wordProblemPercent.toFixed(2)),
        problemSolving: parseFloat(problemSolvingPercent.toFixed(2)),
      };

      setPerformance(newPerf);
      console.log("✅ User performance:", newPerf);
    } catch (err) {
      console.error("Error fetching user performance:", err);
      setPerformance({ time: 0, wordProblem: 0, problemSolving: 0 });
    } finally {
      setLoading(false);
    }
  };

  // 🎨 Draw radar
  const drawRadar = (data: UserPerformance) => {
    if (!radarRef.current) return;
    const ctx = radarRef.current.getContext("2d");
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(54, 162, 235, 0.3)");
    gradient.addColorStop(1, "rgba(236, 72, 153, 0.3)");

    chartInstance.current = new ChartJS(ctx, {
      type: "radar",
      data: {
        labels: ["⏱ Time", "📘 Word Problem", "🧩 Problem Solving"],
        datasets: [
          {
            label: "Your Performance (Uniform Motion in Physics)",
            data: [data.time, data.wordProblem, data.problemSolving],
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
            labels: { color: "#111", font: { size: 14, weight: "bold" } },
          },
          title: {
            display: true,
            text: "📊 Your Performance (Uniform Motion in Physics)",
            color: "#111",
            font: { size: 18, weight: "bold" },
          },
          datalabels: {
            color: "#000",
            font: { weight: "bold", size: 12 },
            formatter: (val: number) =>
              Number.isInteger(val) ? `${val}%` : `${val.toFixed(2)}%`,
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
  };

  useEffect(() => {
    fetchUserPerformance();
  }, []);

  useEffect(() => {
    drawRadar(performance);
  }, [performance]);

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen>
        <div
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "90vh",
            gap: "16px",
          }}
        >
          <h2 style={{ fontWeight: "bold", fontSize: "22px", color: "#222" }}>
            🌟 Your Best Performance
          </h2>

          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              height: "420px",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0px 6px 18px rgba(0,0,0,0.08)",
              padding: "16px",
            }}
          >
            <canvas ref={radarRef} />
          </div>

          <button
            onClick={fetchUserPerformance}
            disabled={loading}
            style={{
              padding: "10px 20px",
              background: loading
                ? "linear-gradient(90deg, #9CA3AF, #D1D5DB)"
                : "linear-gradient(90deg, #36A2EB, #EC4899)",
              color: "white",
              fontSize: "15px",
              fontWeight: 700,
              borderRadius: "10px",
              border: "none",
              marginTop: "16px",
              width: "100%",
              maxWidth: "200px",
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "🔄 Refreshing..." : "🔄 Refresh"}
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Motion_Radar;
