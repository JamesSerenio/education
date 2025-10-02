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
const MAX_TIME = 300;

interface UserScore {
  time: number;
  solving: number;
  problemSolving: number;
}

const AdminRadar: React.FC = () => {
  const radarRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<ChartJS | null>(null);
  const [averageScore, setAverageScore] = useState<UserScore>({
    time: 0,
    solving: 0,
    problemSolving: 0,
  });

  const fetchAllUsersData = async () => {
    try {
      const { data: scoresData, error: scoresError } = await supabase
        .from("scores")
        .select(`time_taken, score`);

      if (scoresError) {
        console.error("Error fetching scores:", scoresError);
        return;
      }

      if (!scoresData || scoresData.length === 0) return;

      let totalTime = 0;
      let totalScore = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scoresData.forEach((s: any) => {
        totalTime += MAX_TIME - s.time_taken;
        totalScore += s.score;
      });

      const avgTime = Math.round((totalTime / scoresData.length / MAX_TIME) * 100);
      const avgScore = Math.round((totalScore / scoresData.length / MAX_SCORE) * 100);

      setAverageScore({
        time: avgTime,
        solving: avgScore,
        problemSolving: avgScore,
      });
    } catch (err) {
      console.error("Error fetching data:", err);
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
            color: "white",
            font: { weight: 'bold', size: 12 },
            formatter: (value) => `${value}%`,
          },
        },
        scales: {
          r: {
            angleLines: { color: "rgba(156, 163, 175, 0.3)" },
            grid: { circular: true, color: "rgba(209, 213, 219, 0.3)" },
            pointLabels: { color: "#111827", font: { size: 14, weight: "bold" } },
            ticks: { color: "#4b5563", backdropColor: "transparent" },
            suggestedMin: 0,
            suggestedMax: 100,
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
