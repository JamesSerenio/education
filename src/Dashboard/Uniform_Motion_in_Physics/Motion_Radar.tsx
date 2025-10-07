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

const MAX_SCORE = 5;
const MAX_TIME = 300; // seconds

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
    solving: 0,
    problemSolving: 0,
  });

  // Map Supabase raw data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapToScoreWithQuizzes = (rawData: any): ScoreWithQuizzes => ({
    id: rawData.id || "",
    score: rawData.score || null,
    time_taken: rawData.time_taken || null,
    created_at: rawData.created_at || new Date().toISOString(),
    quiz_id: rawData.quiz_id || "",
    quizzes: rawData.quizzes
      ? {
          id: rawData.quizzes.id || "",
          category: rawData.quizzes.category || "",
          subject: rawData.quizzes.subject || "",
        }
      : null,
  });

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

      const userId = user.id;

      const { data: allScores, error: scoresError } = await supabase
        .from("scores")
        .select(`id, score, time_taken, created_at, quiz_id, quizzes!quiz_id(id, category, subject)`)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (scoresError) {
        console.error("Error fetching scores:", scoresError);
        setPerformance({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      const typedScores: ScoreWithQuizzes[] = (allScores || []).map(mapToScoreWithQuizzes);
      if (!typedScores.length) {
        setPerformance({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      // ✅ Filter only "Uniform Motion in Physics" subject
      const uniformMotionScores = typedScores.filter(
        s => s.quizzes?.subject === "Uniform Motion in Physics"
      );

      // Default values
      let timePercent = 0;
      let solvingPercent = 0;
      let problemSolvingPercent = 0;

      if (uniformMotionScores.length > 0) {
        // ✅ TIME calculation (average time)
        const avgTime =
          uniformMotionScores.reduce((sum, s) => sum + (s.time_taken || 0), 0) /
          uniformMotionScores.length;

        timePercent = Math.max(
          0,
          Math.min(100, Math.round(((MAX_TIME - avgTime) / MAX_TIME) * 100))
        );

        // ✅ SOLVING
        const solvingScores = uniformMotionScores.filter(
          s => s.quizzes?.category === "Solving" && s.score !== null
        );
        if (solvingScores.length > 0) {
          const avgSolving =
            solvingScores.reduce((sum, s) => sum + (s.score || 0), 0) /
            solvingScores.length;
          solvingPercent = Math.min(100, Math.round((avgSolving / MAX_SCORE) * 100));
        }

        // ✅ PROBLEM SOLVING
        const problemSolvingScores = uniformMotionScores.filter(
          s => s.quizzes?.category === "Problem Solving" && s.score !== null
        );
        if (problemSolvingScores.length > 0) {
          const avgProblemSolving =
            problemSolvingScores.reduce((sum, s) => sum + (s.score || 0), 0) /
            problemSolvingScores.length;
          problemSolvingPercent = Math.min(100, Math.round((avgProblemSolving / MAX_SCORE) * 100));
        }
      }

      setPerformance({
        time: timePercent,
        solving: solvingPercent,
        problemSolving: problemSolvingPercent,
      });
    } catch (err) {
      console.error("Error in fetchRadarData:", err);
      setPerformance({ time: 0, solving: 0, problemSolving: 0 });
    }
  };

  // Chart rendering
  useEffect(() => {
    if (!radarRef.current) return;
    const ctx = radarRef.current.getContext("2d");
    if (!ctx) return;

    if (chartInstance.current) chartInstance.current.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(54, 162, 235, 0.3)");
    gradient.addColorStop(1, "rgba(236, 72, 153, 0.3)");

    chartInstance.current = new ChartJS(ctx, {
      type: "radar",
      data: {
        labels: ["⏱ Time", "🧩 Problem Solving", "🧮 Solving"],
        datasets: [
          {
            label: "✨ My Performance (Uniform Motion in Physics)",
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
        plugins: {
          legend: {
            display: true,
            labels: { color: "#111", font: { size: 14, weight: "bold" } },
          },
          title: {
            display: true,
            text: "📊 Uniform Motion in Physics",
            color: "#111",
            font: { size: 20, weight: "bold" },
          },
          datalabels: {
            color: "#000",
            font: { weight: "bold", size: 12 },
            formatter: val => `${val}%`,
          },
        },
        scales: {
          r: {
            angleLines: { color: "rgba(156, 163, 175, 0.3)" },
            grid: { color: "rgba(209, 213, 219, 0.3)" },
            pointLabels: { color: "#111", font: { size: 14, weight: "bold" } },
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: { display: false },
          },
        },
      },
      plugins: [ChartDataLabels],
    });

    return () => chartInstance.current?.destroy();
  }, [performance]);

  useEffect(() => {
    fetchRadarData();
  }, []);

  return (
    <IonPage>
      <IonHeader></IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: "20px" }}>
          <div
            style={{
              width: "100%",
              height: "650px",
              marginTop: "40px",
              background: "white",
              borderRadius: "20px",
              boxShadow: "0px 8px 20px rgba(0,0,0,0.1)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ flex: 1 }}>
              <canvas ref={radarRef} />
            </div>
            <div style={{ textAlign: "center", marginTop: "15px" }}>
              <button
                onClick={fetchRadarData}
                style={{
                  padding: "12px 24px",
                  background: "linear-gradient(90deg, #6366F1, #EC4899)",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "bold",
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  width: "100%",
                  maxWidth: "250px",
                }}
              >
                🔄 Refresh My Data
              </button>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};
export default Motion_Radar;
