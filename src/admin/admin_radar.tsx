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
  const physicsRadarRef = useRef<HTMLCanvasElement | null>(null);
  const physicsChartInstance = useRef<ChartJS | null>(null);
  const [averageScore, setAverageScore] = useState<UserScore>({
    time: 0,
    solving: 0,
    problemSolving: 0,
  });
  const [physicsAverageScore, setPhysicsAverageScore] = useState<UserScore>({
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
        setPhysicsAverageScore({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      // Map raw Supabase data to our typed interface
      const typedScores: ScoreWithQuizzes[] = (allScores || []).map(mapToScoreWithQuizzes);

      console.log("All fetched scores with categories:", typedScores); // DEBUG: Check this in console

      if (typedScores.length === 0) {
        console.log("No scores found, defaulting to 0%");
        setAverageScore({ time: 0, solving: 0, problemSolving: 0 });
        setPhysicsAverageScore({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      // Arithmetic Calculations
      const solvingScores: ScoreWithQuizzes[] = typedScores.filter(s => s.quizzes?.category === "Solving");
      const problemSolvingScores: ScoreWithQuizzes[] = typedScores.filter(s => s.quizzes?.category === "Problem Solving");
      const arithmeticScores = [...solvingScores, ...problemSolvingScores];

      // Calculate average time performance for Arithmetic (only from relevant scores)
      let avgTimePercent = 0;
      if (arithmeticScores.length > 0) {
        let totalTimePercent = 0;
        arithmeticScores.forEach((score) => {
          const rawTime = score.time_taken ?? 0;
          totalTimePercent += Math.max(0, Math.round(((MAX_TIME - rawTime) / MAX_TIME) * 100));
        });
        avgTimePercent = Math.round(totalTimePercent / arithmeticScores.length);
        console.log(`Arithmetic average time performance: ${avgTimePercent}% (from ${arithmeticScores.length} attempts)`);
      } else {
        console.log("No Arithmetic scores found, defaulting time to 0%");
      }

      // Calculate average score % for Solving category
      let avgSolvingPercent = 0;
      if (solvingScores.length > 0) {
        let totalSolvingScore = 0;
        solvingScores.forEach((s) => {
          totalSolvingScore += (s.score ?? 0);
        });
        avgSolvingPercent = Math.min(100, Math.round((totalSolvingScore / solvingScores.length) / MAX_SCORE * 100));
        console.log(`Arithmetic Solving average: ${Math.round((totalSolvingScore / solvingScores.length))}/5 (${solvingScores.length} attempts) → ${avgSolvingPercent}%`);
      } else {
        console.log("No Arithmetic Solving scores found, defaulting to 0%");
      }

      // Calculate average score % for Problem Solving category
      let avgProblemSolvingPercent = 0;
      if (problemSolvingScores.length > 0) {
        let totalProblemSolvingScore = 0;
        problemSolvingScores.forEach((s) => {
          totalProblemSolvingScore += (s.score ?? 0);
        });
        avgProblemSolvingPercent = Math.min(100, Math.round((totalProblemSolvingScore / problemSolvingScores.length) / MAX_SCORE * 100));
        console.log(`Arithmetic Problem Solving average: ${Math.round((totalProblemSolvingScore / problemSolvingScores.length))}/5 (${problemSolvingScores.length} attempts) → ${avgProblemSolvingPercent}%`);
      } else {
        console.log("No Arithmetic Problem Solving scores found, defaulting to 0%");
      }

      // Update arithmetic state
      setAverageScore({
        time: avgTimePercent,
        solving: avgSolvingPercent,
        problemSolving: avgProblemSolvingPercent,
      });

      console.log("Final arithmetic average values:", {
        time: avgTimePercent,
        solving: avgSolvingPercent,
        problemSolving: avgProblemSolvingPercent,
      });

      // Physics Calculations (Uniform Motion in Physics)
      const physicsScores: ScoreWithQuizzes[] = typedScores.filter(s => s.quizzes?.category === "Uniform Motion in Physics");

      let physicsAvgTime = 0;
      let physicsAvgSolving = 0;
      let physicsAvgProblemSolving = 0;

      if (physicsScores.length > 0) {
        // Calculate average time performance for Physics
        let totalTimePercent = 0;
        physicsScores.forEach((score) => {
          const rawTime = score.time_taken ?? 0;
          totalTimePercent += Math.max(0, Math.round(((MAX_TIME - rawTime) / MAX_TIME) * 100));
        });
        physicsAvgTime = Math.round(totalTimePercent / physicsScores.length);
        console.log(`Physics average time performance: ${physicsAvgTime}% (from ${physicsScores.length} attempts)`);

        // Calculate average score % (used for both solving and problem solving since no sub-categories specified)
        let totalScore = 0;
        physicsScores.forEach((s) => {
          totalScore += (s.score ?? 0);
        });
        const avgScorePercent = Math.min(100, Math.round((totalScore / physicsScores.length) / MAX_SCORE * 100));
        physicsAvgSolving = avgScorePercent;
        physicsAvgProblemSolving = avgScorePercent;
        console.log(`Physics average score: ${Math.round((totalScore / physicsScores.length))}/5 (${physicsScores.length} attempts) → ${avgScorePercent}% (applied to both Solving and Problem Solving)`);
      } else {
        console.log("No Uniform Motion in Physics scores found, defaulting to 0%");
      }

      // Update physics state
      setPhysicsAverageScore({
        time: physicsAvgTime,
        solving: physicsAvgSolving,
        problemSolving: physicsAvgProblemSolving,
      });

      console.log("Final physics average values:", {
        time: physicsAvgTime,
        solving: physicsAvgSolving,
        problemSolving: physicsAvgProblemSolving,
      });

    } catch (err) {
      console.error("Error fetching data:", err);
      setAverageScore({ time: 0, solving: 0, problemSolving: 0 });
      setPhysicsAverageScore({ time: 0, solving: 0, problemSolving: 0 });
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
            grid: { circular: false, color: "rgba(209, 213, 219, 0.3)" }, // polygon instead of circle
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
    if (!physicsRadarRef.current) return;

    const ctx = physicsRadarRef.current.getContext("2d");
    if (!ctx) return;

    if (physicsChartInstance.current) physicsChartInstance.current.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(99, 102, 241, 0.4)");
    gradient.addColorStop(1, "rgba(236, 72, 153, 0.4)");

    physicsChartInstance.current = new ChartJS(ctx, {
      type: "radar",
      data: {
        labels: ["⏱ Time", "🧮 Solving", "🧩 Problem Solving"],
        datasets: [
          {
            label: "All Students Average",
            data: [physicsAverageScore.time, physicsAverageScore.solving, physicsAverageScore.problemSolving],
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
            text: "📊 Uniform Motion in Physics Radar Chart (All Students)",
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
            grid: { circular: false, color: "rgba(209, 213, 219, 0.3)" }, // polygon instead of circle
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

    return () => physicsChartInstance.current?.destroy();
  }, [physicsAverageScore]);

  useEffect(() => {
    fetchAllUsersData();
  }, []);

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen>
        <div style={{ padding: "20px" }}>
          <div style={{ display: "flex", gap: "20px", marginTop: "40px" }}>
            {/* Arithmetic Radar */}
            <div
              style={{
                flex: 1,
                height: "650px",
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
            </div>

            {/* Physics Radar */}
            <div
              style={{
                flex: 1,
                height: "650px",
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
                <canvas ref={physicsRadarRef} />
              </div>
            </div>
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
      </IonContent>
    </IonPage>
  );
};

export default AdminRadar;
