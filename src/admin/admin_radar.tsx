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
const MAX_TIME = 300; // 5 minutes max per quiz

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
  const radarRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<ChartJS | null>(null);
  const [averageScore, setAverageScore] = useState<UserScore>({
    time: 0,
    solving: 0,
    problemSolving: 0,
  });

  // map supabase row to typed interface
  const mapToScoreWithQuizzes = (rawData: unknown): ScoreWithQuizzes => {
    const d = rawData as Record<string, unknown>;
    const quiz = d.quizzes as Record<string, unknown> | null;

    return {
      id: (d.id as string) || "",
      score: (d.score as number) ?? null,
      time_taken: (d.time_taken as number) ?? null,
      created_at: (d.created_at as string) || new Date().toISOString(),
      quiz_id: (d.quiz_id as string) || "",
      quizzes: quiz
        ? {
            id: (quiz.id as string) || "",
            category: (quiz.category as string) || "",
            subject: (quiz.subject as string) || "",
          }
        : null,
    };
  };

  const fetchArithmeticSequenceData = async () => {
    try {
      // ✅ Fetch scores only for subject = "Arithmetic Sequence"
      const { data: allScores, error: scoresError } = await supabase
        .from("scores")
        .select(
          `
          id,
          score,
          time_taken,
          created_at,
          quiz_id,
          quizzes!quiz_id (id, category, subject)
        `
        )
        .eq("quizzes.subject", "Arithmetic Sequence") // strict filter
        .order("created_at", { ascending: false });

      if (scoresError) {
        console.error("Error fetching scores:", scoresError);
        setAverageScore({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      const typedScores: ScoreWithQuizzes[] = (allScores || []).map(
        mapToScoreWithQuizzes
      );

      if (typedScores.length === 0) {
        console.log("No scores for Arithmetic Sequence quizzes");
        setAverageScore({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      // ✅ Only include Arithmetic Sequence scores in time calculation
      const arithmeticScores = typedScores.filter(
        (s) => s.quizzes?.subject === "Arithmetic Sequence"
      );

      // calculate time performance
      let totalTimePercent = 0;
      arithmeticScores.forEach((score) => {
        const rawTime = score.time_taken ?? 0;
        totalTimePercent += Math.max(
          0,
          Math.round(((MAX_TIME - rawTime) / MAX_TIME) * 100)
        );
      });
      const avgTimePercent = Math.round(
        totalTimePercent / arithmeticScores.length
      );

      // group by category (still Arithmetic Sequence only)
      const solvingScores = arithmeticScores.filter(
        (s) => s.quizzes?.category === "Solving"
      );
      const problemSolvingScores = arithmeticScores.filter(
        (s) => s.quizzes?.category === "Problem Solving"
      );

      // solving %
      let avgSolvingPercent = 0;
      if (solvingScores.length > 0) {
        let totalSolving = 0;
        solvingScores.forEach((s) => (totalSolving += s.score ?? 0));
        avgSolvingPercent = Math.min(
          100,
          Math.round((totalSolving / solvingScores.length / MAX_SCORE) * 100)
        );
      }

      // problem solving %
      let avgProblemSolvingPercent = 0;
      if (problemSolvingScores.length > 0) {
        let totalProblem = 0;
        problemSolvingScores.forEach((s) => (totalProblem += s.score ?? 0));
        avgProblemSolvingPercent = Math.min(
          100,
          Math.round(
            (totalProblem / problemSolvingScores.length / MAX_SCORE) * 100
          )
        );
      }

      setAverageScore({
        time: avgTimePercent,
        solving: avgSolvingPercent,
        problemSolving: avgProblemSolvingPercent,
      });
    } catch (err) {
      console.error("Error fetching Arithmetic Sequence data:", err);
      setAverageScore({ time: 0, solving: 0, problemSolving: 0 });
    }
  };

  useEffect(() => {
    if (!radarRef.current) return;

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
            label: "Arithmetic Sequence Average",
            data: [
              averageScore.time,
              averageScore.solving,
              averageScore.problemSolving,
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
              font: { size: 14, weight: "bold", family: "Roboto, sans-serif" },
            },
          },
          title: {
            display: true,
            text: "📊 Arithmetic Sequence Radar Chart (All Studens)",
            color: "#1f2937",
            font: { size: 20, weight: "bold", family: "Roboto, sans-serif" },
          },
          tooltip: {
            enabled: true,
            bodyColor: "#ffffff",
            titleColor: "#ffffff",
            backgroundColor: "rgba(0,0,0,0.7)",
            callbacks: {
              label: function (context) {
                return `${context.dataset.label} - ${context.label}: ${context.raw}%`;
              },
            },
          },
          datalabels: {
            color: "black",
            font: { weight: "bold", size: 12 },
            formatter: (value) => `${value}%`,
          },
        },
        scales: {
          r: {
            angleLines: { color: "rgba(156, 163, 175, 0.3)" },
            grid: { circular: false, color: "rgba(209, 213, 219, 0.3)" },
            pointLabels: {
              color: "#111827",
              font: { size: 14, weight: "bold" },
            },
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: {
              display: false,
              color: "#4b5563",
              backdropColor: "transparent",
            },
          },
        },
      },
      plugins: [ChartDataLabels],
    });

    return () => chartInstance.current?.destroy();
  }, [averageScore]);

  useEffect(() => {
    fetchArithmeticSequenceData();
  }, []);

  return (
    <IonPage>
      <IonHeader />
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
                onClick={fetchArithmeticSequenceData}
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
                🔄 Refresh Arithmetic Sequence Data
              </button>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminRadar;
