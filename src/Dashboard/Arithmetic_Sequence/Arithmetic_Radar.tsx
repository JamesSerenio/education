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

const MAX_SCORE = 5; // 👉 5 questions max
const MAX_TIME = 300; // 👉 60s × 5 levels = 300s

const Arithmetic_Radar: React.FC = () => {
  const radarRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  const [performance, setPerformance] = useState({
    time: 0,
    solving: 0,
    problemSolving: 0,
  });

  // ✅ Get logged-in user's performance
  const fetchRadarData = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("No user logged in:", userError);
        return;
      }

      const userId = user.id;

      const { data: scores, error: scoreError } = await supabase
        .from("scores")
        .select("time_taken, score")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (scoreError) {
        console.error("Error fetching scores:", scoreError);
        return;
      }

      if (scores && scores.length > 0) {
        const latest = scores[0];

        const rawTime = latest.time_taken ?? 0;
        const rawScore = latest.score ?? 0;

        // ✅ Normalize values to percentage (0–100)
        const timePercent = Math.max(
          0,
          Math.round(((MAX_TIME - rawTime) / MAX_TIME) * 100)
        );
        const scorePercent = Math.min(
          100,
          Math.round((rawScore / MAX_SCORE) * 100)
        );

        setPerformance({
          time: timePercent,
          solving: scorePercent,
          problemSolving: scorePercent,
        });
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };

  // ✅ Init chart
  useEffect(() => {
    if (radarRef.current) {
      const ctx = radarRef.current.getContext("2d");
      if (!ctx) return;

      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, "rgba(99, 102, 241, 0.4)"); // violet
      gradient.addColorStop(1, "rgba(236, 72, 153, 0.4)"); // pink

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
              borderColor: "rgb(147, 51, 234)", // purple border
              borderWidth: 3,
              pointBackgroundColor: "rgb(236, 72, 153)", // pink
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
                font: {
                  size: 14,
                  weight: "bold",
                },
              },
              suggestedMin: 0,
              suggestedMax: 100,
              ticks: {
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
            }}
          >
            <canvas ref={radarRef} />
          </div>
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button
              onClick={fetchRadarData}
              style={{
                padding: "12px 24px",
                background:
                  "linear-gradient(90deg, #6366F1, #EC4899)", // violet → pink
                color: "white",
                fontSize: "16px",
                fontWeight: "bold",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                transition: "0.3s",
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
      </IonContent>
    </IonPage>
  );
};

export default Arithmetic_Radar;
