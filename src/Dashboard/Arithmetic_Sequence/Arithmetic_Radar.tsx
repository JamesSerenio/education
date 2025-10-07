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
const MAX_TIME = 300; // seconds (5 minutes max for the quiz)

interface QuizInfo {
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
  quizzes: QuizInfo | null;
}

const Arithmetic_Radar: React.FC = () => {
  const radarRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  const [performance, setPerformance] = useState({
    time: 0,
    solving: 0,
    problemSolving: 0,
  });

  // ✅ Type-safe mapper (no any used)
  const mapToScoreWithQuizzes = (rawData: Record<string, unknown>): ScoreWithQuizzes => {
    const quizzesData = rawData.quizzes as Record<string, unknown> | null;

    return {
      id: String(rawData.id ?? ""),
      score: typeof rawData.score === "number" ? rawData.score : null,
      time_taken: typeof rawData.time_taken === "number" ? rawData.time_taken : null,
      created_at: typeof rawData.created_at === "string"
        ? rawData.created_at
        : new Date().toISOString(),
      quiz_id: String(rawData.quiz_id ?? ""),
      quizzes: quizzesData
        ? {
            id: String(quizzesData.id ?? ""),
            subject: String(quizzesData.subject ?? ""),
            category: String(quizzesData.category ?? ""),
          }
        : null,
    };
  };

  const fetchRadarData = async (): Promise<void> => {
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

      // ✅ Fetch scores joined with quizzes where subject = 'Arithmetic Sequence'
      const { data: allScores, error: scoresError } = await supabase
        .from("scores")
        .select(
          `
          id,
          score,
          time_taken,
          created_at,
          quiz_id,
          quizzes!quiz_id (
            id,
            subject,
            category
          )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (scoresError) {
        console.error("Error fetching scores:", scoresError);
        setPerformance({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      const typedScores: ScoreWithQuizzes[] = (allScores ?? [])
        .map(mapToScoreWithQuizzes)
        .filter(
          (score) =>
            score.quizzes?.subject?.toLowerCase() === "arithmetic sequence"
        );

      if (typedScores.length === 0) {
        console.log("No Arithmetic Sequence scores found");
        setPerformance({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      // ✅ Filter by category (Solving / Problem Solving)
      const solvingScores = typedScores.filter(
        (s) => s.quizzes?.category === "Solving"
      );
      const problemSolvingScores = typedScores.filter(
        (s) => s.quizzes?.category === "Problem Solving"
      );

      // ✅ Calculate average time
      const totalTimePercent = typedScores.reduce((acc, s) => {
        const raw = s.time_taken ?? MAX_TIME;
        const percent = Math.max(0, Math.round(((MAX_TIME - raw) / MAX_TIME) * 100));
        return acc + percent;
      }, 0);
      const avgTimePercent = Math.round(totalTimePercent / typedScores.length);

      // ✅ Average Solving %
      const solvingPercent = solvingScores.length
        ? Math.round(
            (solvingScores.reduce((a, b) => a + (b.score ?? 0), 0) /
              (solvingScores.length * MAX_SCORE)) *
              100
          )
        : 0;

      // ✅ Average Problem Solving %
      const problemSolvingPercent = problemSolvingScores.length
        ? Math.round(
            (problemSolvingScores.reduce((a, b) => a + (b.score ?? 0), 0) /
              (problemSolvingScores.length * MAX_SCORE)) *
              100
          )
        : 0;

      console.log("✅ Arithmetic only values:", {
        avgTimePercent,
        solvingPercent,
        problemSolvingPercent,
      });

      setPerformance({
        time: avgTimePercent,
        solving: solvingPercent,
        problemSolving: problemSolvingPercent,
      });
    } catch (err) {
      console.error("Error in fetchRadarData:", err);
      setPerformance({ time: 0, solving: 0, problemSolving: 0 });
    }
  };

  // ✅ Chart rendering
  useEffect(() => {
    if (radarRef.current) {
      const ctx = radarRef.current.getContext("2d");
      if (!ctx) return;

      if (chartInstance.current) chartInstance.current.destroy();

      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, "rgba(99, 102, 241, 0.4)");
      gradient.addColorStop(1, "rgba(236, 72, 153, 0.4)");

      chartInstance.current = new ChartJS(ctx, {
        type: "radar",
        data: {
          labels: ["⏱ Time", "🧮 Solving", "🧩 Problem Solving"],
          datasets: [
            {
              label: "✨ Arithmetic Performance",
              data: [
                performance.time,
                performance.solving,
                performance.problemSolving,
              ],
              fill: true,
              backgroundColor: gradient,
              borderColor: "rgb(147, 51, 234)",
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
              labels: {
                color: "#374151",
                font: {
                  size: 14,
                  family: "Roboto, sans-serif",
                  weight: "bold",
                },
              },
            },
            title: {
              display: true,
              text: "📊 Arithmetic Sequence Radar Chart",
              color: "#1f2937",
              font: {
                size: 20,
                weight: "bold",
                family: "Roboto, sans-serif",
              },
            },
            datalabels: {
              color: "black",
              font: { weight: "bold", size: 12 },
              formatter: (value: number) => `${Math.round(value)}%`,
            },
          },
          scales: {
            r: {
              suggestedMin: 0,
              suggestedMax: 100,
              ticks: { display: false },
              grid: { color: "rgba(209, 213, 219, 0.3)" },
              pointLabels: {
                color: "#111827",
                font: { size: 14, weight: "bold" },
              },
            },
          },
        },
        plugins: [ChartDataLabels],
      });
    }

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
                  boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                  transition: "0.3s",
                  width: "100%",
                  maxWidth: "250px",
                }}
                onMouseOver={(e) =>
                  ((e.target as HTMLButtonElement).style.transform = "scale(1.05)")
                }
                onMouseOut={(e) =>
                  ((e.target as HTMLButtonElement).style.transform = "scale(1)")
                }
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

export default Arithmetic_Radar;
