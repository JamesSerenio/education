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

const Arithmetic_Radar: React.FC = () => {
  const radarRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<ChartJS | null>(null);

  const [performance, setPerformance] = useState({
    time: 0,
    solving: 0,
    problemSolving: 0,
  });

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
        .select(
          `id, score, time_taken, created_at, quiz_id, quizzes!quiz_id(id, category, subject)`
        )
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

      const arithmeticScores = typedScores.filter(
        (s) => s.quizzes?.subject === "Arithmetic Sequence"
      );

      let timePercent = 0;
      let solvingPercent = 0;
      let problemSolvingPercent = 0;

      if (arithmeticScores.length > 0) {
        const avgTime =
          arithmeticScores.reduce((sum, s) => sum + (s.time_taken || 0), 0) /
          arithmeticScores.length;

        const timeRaw = ((MAX_TIME - avgTime) / MAX_TIME) * 100;
        timePercent = Math.max(0, Math.min(100, parseFloat(timeRaw.toFixed(2))));

        const solvingScores = arithmeticScores.filter(
          (s) => s.quizzes?.category === "Solving" && s.score !== null
        );
        if (solvingScores.length > 0) {
          const avgSolving =
            solvingScores.reduce((sum, s) => sum + (s.score || 0), 0) / solvingScores.length;
          solvingPercent = Math.floor((avgSolving / MAX_SCORE) * 100);
        }

        const problemSolvingScores = arithmeticScores.filter(
          (s) => s.quizzes?.category === "Problem Solving" && s.score !== null
        );
        if (problemSolvingScores.length > 0) {
          const avgProblemSolving =
            problemSolvingScores.reduce((sum, s) => sum + (s.score || 0), 0) /
            problemSolvingScores.length;
          problemSolvingPercent = Math.floor((avgProblemSolving / MAX_SCORE) * 100);
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

  useEffect(() => {
    if (!radarRef.current) return;
    const ctx = radarRef.current.getContext("2d");
    if (!ctx) return;

    if (chartInstance.current) chartInstance.current.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 500);
    gradient.addColorStop(0, "rgba(54, 162, 235, 0.3)");
    gradient.addColorStop(1, "rgba(236, 72, 153, 0.3)");

    chartInstance.current = new ChartJS(ctx, {
      type: "radar",
      data: {
        labels: ["⏱ Time", "🧩 Problem Solving", "🧮 Solving"],
        datasets: [
          {
            label: "✨ My Performance (Arithmetic Sequence)",
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
            labels: { color: "#111", font: { size: 13, weight: "bold" } },
          },
          title: {
            display: true,
            text: "📊 Arithmetic Sequence",
            color: "#111",
            font: { size: 18, weight: "bold" },
          },
          datalabels: {
            color: "#000",
            font: { weight: "bold", size: 11 },
            formatter: (val: number, context: { dataIndex: number }) => {
              const labelIndex = context.dataIndex;
              if (labelIndex === 0) return `${val.toFixed(2)}%`;
              return `${Math.round(val)}%`;
            },
          },
        },
        scales: {
          r: {
            angleLines: { color: "rgba(156, 163, 175, 0.3)" },
            grid: { color: "rgba(209, 213, 219, 0.3)" },
            pointLabels: { color: "#111", font: { size: 12, weight: "bold" } },
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
        <div
          style={{
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "90vh",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              height: "450px",
              background: "white",
              borderRadius: "16px",
              boxShadow: "0px 8px 20px rgba(0,0,0,0.08)",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: "100%", height: "100%" }}>
              <canvas ref={radarRef} style={{ width: "100%", height: "100%" }} />
            </div>
            <button
              onClick={fetchRadarData}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(90deg, #36A2EB, #EC4899)",
                color: "white",
                fontSize: "15px",
                fontWeight: "bold",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                marginTop: "16px",
                width: "100%",
                maxWidth: "200px",
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Arithmetic_Radar;
