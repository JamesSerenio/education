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
import ChartDataLabels from 'chartjs-plugin-datalabels';
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
const MAX_TIME = 300; // seconds (5 minutes max for the quiz)

interface UserScore {
  time: number;
  solving: number;
  problemSolving: number;
}

// TypeScript interface for the fetched score data (with quizzes join)
interface ScoreWithQuizzes {
  id: string;
  score: number | null;
  time_taken: number | null;
  created_at: string;
  quiz_id: string;
  quizzes: {
    id: string;
    category: string;
  } | null;
}

const AdminRadar: React.FC = () => {
  const radarRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<ChartJS | null>(null);
  const [averageScore, setAverageScore] = useState<UserScore>({
    time: 0,
    solving: 0,
    problemSolving: 0,
  });

  // Helper function to map raw Supabase data to our typed interface
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapToScoreWithQuizzes = (rawData: any): ScoreWithQuizzes => {
    return {
      id: rawData.id || '',
      score: rawData.score || null,
      time_taken: rawData.time_taken || null,
      created_at: rawData.created_at || new Date().toISOString(), // Default if missing
      quiz_id: rawData.quiz_id || '',
      quizzes: rawData.quizzes 
        ? {
            id: rawData.quizzes.id || '',
            category: rawData.quizzes.category || ''
          }
        : null,
    };
  };

  const fetchAllUsersData = async () => {
    try {
      // Fetch ALL scores with category info (join with quizzes) - no user filter for admin view
      const { data: allScores, error: scoresError } = await supabase
        .from("scores")
        .select(`
          id,
          score,
          time_taken,
          created_at,
          quiz_id,
          quizzes!quiz_id (id, category)
        `)
        .order("created_at", { ascending: false });

      if (scoresError) {
        console.error("Error fetching scores:", scoresError);
        setAverageScore({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      // Map raw Supabase data to our typed interface
      const typedScores: ScoreWithQuizzes[] = (allScores || []).map(mapToScoreWithQuizzes);

      console.log("All fetched scores with categories:", typedScores); // DEBUG: Check this in console

      if (typedScores.length === 0) {
        console.log("No scores found, defaulting to 0%");
        setAverageScore({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      // Calculate overall average time performance (across all scores/categories)
      let totalTimePercent = 0;
      typedScores.forEach((score) => {
        const rawTime = score.time_taken ?? 0;
        totalTimePercent += Math.max(0, Math.round(((MAX_TIME - rawTime) / MAX_TIME) * 100));
      });
      const avgTimePercent = Math.round(totalTimePercent / typedScores.length);
      console.log(`Overall average time performance: ${avgTimePercent}% (from ${typedScores.length} total attempts)`);

      // Group scores by category
      const solvingScores: ScoreWithQuizzes[] = [];
      const problemSolvingScores: ScoreWithQuizzes[] = [];

      typedScores.forEach((score) => {
        const category = score.quizzes?.category || null;
        console.log(`Score ID ${score.id}: Score=${score.score}, Category='${category}'`); // DEBUG

        if (category === "Solving") {
          solvingScores.push(score);
        } else if (category === "Problem Solving") {
          problemSolvingScores.push(score);
        }
      });

      // Calculate average score % for Solving category
      let avgSolvingPercent = 0;
      if (solvingScores.length > 0) {
        let totalSolvingScore = 0;
        solvingScores.forEach((s) => {
          totalSolvingScore += (s.score ?? 0);
        });
        avgSolvingPercent = Math.min(100, Math.round((totalSolvingScore / solvingScores.length) / MAX_SCORE * 100));
        console.log(`Solving average: ${Math.round((totalSolvingScore / solvingScores.length))}/5 (${solvingScores.length} attempts) → ${avgSolvingPercent}%`);
      } else {
        console.log("No Solving scores found, defaulting to 0%");
      }

      // Calculate average score % for Problem Solving category
      let avgProblemSolvingPercent = 0;
      if (problemSolvingScores.length > 0) {
        let totalProblemSolvingScore = 0;
        problemSolvingScores.forEach((s) => {
          totalProblemSolvingScore += (s.score ?? 0);
        });
        avgProblemSolvingPercent = Math.min(100, Math.round((totalProblemSolvingScore / problemSolvingScores.length) / MAX_SCORE * 100));
        console.log(`Problem Solving average: ${Math.round((totalProblemSolvingScore / problemSolvingScores.length))}/5 (${problemSolvingScores.length} attempts) → ${avgProblemSolvingPercent}%`);
      } else {
        console.log("No Problem Solving scores found, defaulting to 0%");
      }

      // Update average state
      setAverageScore({
        time: avgTimePercent,
        solving: avgSolvingPercent,
        problemSolving: avgProblemSolvingPercent,
      });

      console.log("Final average values:", {
        time: avgTimePercent,
        solving: avgSolvingPercent,
        problemSolving: avgProblemSolvingPercent,
      });

    } catch (err) {
      console.error("Error fetching data:", err);
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
            label: "All Students Average",
            data: [averageScore.time, averageScore.solving, averageScore.problemSolving],
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
            labels: { color: "#374151", font: { size: 14, weight: "bold", family: "Roboto, sans-serif" } },
          },
          title: {
            display: true,
            text: "📊 Arithmetic Radar Chart (All Students)",
            color: "#1f2937",
            font: { size: 20, weight: "bold", family: "Roboto, sans-serif" },
          },
          tooltip: {
            enabled: true,
            bodyColor: "#ffffff", // White tooltip text
            titleColor: "#ffffff", // White tooltip title
            backgroundColor: "rgba(0,0,0,0.7)", // Dark background for contrast
            callbacks: {
              label: function (context) {
                return `${context.dataset.label} - ${context.label}: ${context.raw}%`;
              },
            },
          },
          datalabels: {
            color: "black", // Changed to black for % labels
            font: { weight: 'bold', size: 12 },
            formatter: (value) => `${value}%`,
          },
        },
        scales: {
          r: {
            angleLines: { color: "rgba(156, 163, 175, 0.3)" },
            grid: { circular: true, color: "rgba(209, 213, 219, 0.3)" },
            pointLabels: { color: "#111827", font: { size: 14, weight: "bold" } },
            suggestedMin: 0,
            suggestedMax: 100,
            ticks: {
              display: false, // Hide the numerical tick labels (0, 20, 40, 60, 80, 100)
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
    fetchAllUsersData();
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
                onClick={fetchAllUsersData}
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
                🔄 Refresh All Students Data
              </button>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminRadar;
