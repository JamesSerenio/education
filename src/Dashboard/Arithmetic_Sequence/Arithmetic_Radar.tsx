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
import { supabase } from "../../utils/supabaseClient";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  RadarController,
  Title
);

const MAX_SCORE = 5;
const MAX_TIME = 300; // seconds (5 minutes max for the quiz)

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

const Arithmetic_Radar: React.FC = () => {
  const radarRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  const [performance, setPerformance] = useState({
    time: 0,
    solving: 0,
    problemSolving: 0,
  });

  // Helper function to map raw Supabase data to our typed interface
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

  const fetchRadarData = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser  ();

      if (userError || !user) {
        console.error("No user logged in:", userError);
        setPerformance({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      const userId = user.id;

      // Fetch ALL recent scores with category info (join with quizzes)
      // Limit to last 10 attempts to keep it efficient
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
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10); // Adjust if you have more attempts

      if (scoresError) {
        console.error("Error fetching scores:", scoresError);
        setPerformance({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      // Map raw Supabase data to our typed interface (no casting needed!)
      const typedScores: ScoreWithQuizzes[] = (allScores || []).map(mapToScoreWithQuizzes);

      console.log("All fetched scores with categories:", typedScores); // DEBUG: Check this in console

      if (typedScores.length === 0) {
        console.log("No scores found, defaulting to 0%");
        setPerformance({ time: 0, solving: 0, problemSolving: 0 });
        return;
      }

      // Get latest overall time (most recent score, regardless of category)
      const latestOverall = typedScores[0];
      const rawTime = latestOverall.time_taken ?? 0;
      const timePercent = Math.max(
        0,
        Math.round(((MAX_TIME - rawTime) / MAX_TIME) * 100)
      );
      console.log(`Latest time taken: ${rawTime}s → Time performance: ${timePercent}%`);

      // Initialize typed arrays for each category
      const solvingScores: ScoreWithQuizzes[] = [];
      const problemSolvingScores: ScoreWithQuizzes[] = [];

      // Group scores by category (manual JS filtering)
      typedScores.forEach((score) => {
        // Safe access to category with optional chaining
        const category = score.quizzes?.category || null;
        console.log(`Score ID ${score.id}: Score=${score.score}, Category='${category}'`); // DEBUG

        if (category === "Solving") {
          solvingScores.push(score);
        } else if (category === "Problem Solving") {
          problemSolvingScores.push(score);
        }
      });

      // Sort each by created_at DESC to get latest (most recent first)
      solvingScores.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      problemSolvingScores.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Calculate percentages
      let solvingPercent = 0;
      if (solvingScores.length > 0) {
        const latestSolving = solvingScores[0];
        const rawScoreSolving = latestSolving.score ?? 0;
        solvingPercent = Math.min(100, Math.round((rawScoreSolving / MAX_SCORE) * 100));
        console.log(`Latest Solving: ${rawScoreSolving}/5 (${solvingScores.length} attempts) → ${solvingPercent}%`);
      } else {
        console.log("No Solving scores found, defaulting to 0%");
      }

      let problemSolvingPercent = 0;
      if (problemSolvingScores.length > 0) {
        const latestProblemSolving = problemSolvingScores[0];
        const rawScoreProblemSolving = latestProblemSolving.score ?? 0;
        problemSolvingPercent = Math.min(100, Math.round((rawScoreProblemSolving / MAX_SCORE) * 100));
        console.log(`Latest Problem Solving: ${rawScoreProblemSolving}/5 (${problemSolvingScores.length} attempts) → ${problemSolvingPercent}%`);
      } else {
        console.log("No Problem Solving scores found, defaulting to 0%");
      }

      // Update performance state
      setPerformance({
        time: timePercent,
        solving: solvingPercent,
        problemSolving: problemSolvingPercent,
      });

      console.log("Final performance values:", {
        time: timePercent,
        solving: solvingPercent,
        problemSolving: problemSolvingPercent,
      });

    } catch (err) {
      console.error("Error in fetchRadarData:", err);
      setPerformance({ time: 0, solving: 0, problemSolving: 0 });
    }
  };

  useEffect(() => {
    if (radarRef.current) {
      const ctx = radarRef.current.getContext("2d");
      if (!ctx) return;

      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, "rgba(99, 102, 241, 0.4)");
      gradient.addColorStop(1, "rgba(236, 72, 153, 0.4)");

      chartInstance.current = new ChartJS(ctx, {
        type: "radar",
        data: {
          labels: ["⏱ Time", "🧮 Solving", "🧩 Problem Solving"],
          datasets: [
            {
              label: "✨ My Performance",
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
              text: "📊 Arithmetic Radar Chart",
              color: "#1f2937",
              font: {
                size: 20,
                weight: "bold",
                family: "Roboto, sans-serif",
              },
            },
          },
          scales: {
            r: {
              angleLines: { color: "rgba(156, 163, 175, 0.3)" },
              grid: { color: "rgba(209, 213, 219, 0.3)" },
              pointLabels: {
                color: "#111827",
                font: { size: 14, weight: "bold" },
              },
              suggestedMin: 0,
              suggestedMax: 100,
              ticks: {
                display: false, // Hide the numerical tick labels (0, 20, 40, 60, 80, 100)
                backdropColor: "transparent",
                color: "#4b5563",
              },
            },
          },
        },
      });
    }

    return () => {
      chartInstance.current?.destroy();
    };
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

            {/* Refresh Button Inside */}
            <div style={{ textAlign: "center", marginTop: "15px" }}>
              <button
                onClick={fetchRadarData}
                style={{
                  padding: "12px 24px",
                  background:
                    "linear-gradient(90deg, #6366F1, #EC4899)",
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
                  ((e.target as HTMLButtonElement).style.transform =
                    "scale(1.05)")
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
