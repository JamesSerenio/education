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
const MAX_TIME = 300;

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
  const radarRefArithmetic = useRef<HTMLCanvasElement | null>(null);
  const radarRefPhysics = useRef<HTMLCanvasElement | null>(null);
  const chartArithmetic = useRef<ChartJS | null>(null);
  const chartPhysics = useRef<ChartJS | null>(null);

  const [arithmeticScore, setArithmeticScore] = useState<UserScore>({
    time: 0,
    solving: 0,
    problemSolving: 0,
  });

  const [physicsScore, setPhysicsScore] = useState<UserScore>({
    time: 0,
    solving: 0,
    problemSolving: 0,
  });

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

  // 🔹 Fetch subject-specific data
  const fetchSubjectData = async (subject: string) => {
    try {
      const { data, error } = await supabase
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
        .eq("quizzes.subject", subject)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const typedScores: ScoreWithQuizzes[] = (data || []).map(mapToScoreWithQuizzes);
      if (typedScores.length === 0) {
        return { time: 0, solving: 0, problemSolving: 0 };
      }

      // 🕒 TIME % (Subject-specific)
      const subjectTimeScores = typedScores.filter(
        (s) => s.quizzes?.subject === subject
      );
      const timePercents = subjectTimeScores.map((s) =>
        Math.max(0, Math.round(((MAX_TIME - (s.time_taken ?? 0)) / MAX_TIME) * 100))
      );
      const timeAvg =
        timePercents.length > 0
          ? Math.round(
              timePercents.reduce((a, b) => a + b, 0) / timePercents.length
            )
          : 0;

      // 🧮 SOLVING %
      const solvingScores = typedScores.filter((s) => s.quizzes?.category === "Solving");
      const solvingPercents = solvingScores.map((s) =>
        Math.min(100, Math.round(((s.score ?? 0) / MAX_SCORE) * 100))
      );
      const solvingAvg =
        solvingPercents.length > 0
          ? Math.round(
              solvingPercents.reduce((a, b) => a + b, 0) / solvingPercents.length
            )
          : 0;

      // 🧩 PROBLEM SOLVING %
      const problemSolvingScores = typedScores.filter(
        (s) => s.quizzes?.category === "Problem Solving"
      );
      const problemPercents = problemSolvingScores.map((s) =>
        Math.min(100, Math.round(((s.score ?? 0) / MAX_SCORE) * 100))
      );
      const problemAvg =
        problemPercents.length > 0
          ? Math.round(
              problemPercents.reduce((a, b) => a + b, 0) / problemPercents.length
            )
          : 0;

      return {
        time: timeAvg,
        solving: solvingAvg,
        problemSolving: problemAvg,
      };
    } catch (err) {
      console.error(`Error fetching ${subject} data:`, err);
      return { time: 0, solving: 0, problemSolving: 0 };
    }
  };

  // 🔹 Fetch both subjects
  const fetchAllData = async () => {
    const arithmetic = await fetchSubjectData("Arithmetic Sequence");
    const physics = await fetchSubjectData("Uniform Motion in Physics");
    setArithmeticScore(arithmetic);
    setPhysicsScore(physics);
  };

  // 🔹 Create Radar Chart
  const createRadarChart = (
    ctx: CanvasRenderingContext2D,
    data: UserScore,
    title: string
  ) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(99, 102, 241, 0.4)");
    gradient.addColorStop(1, "rgba(236, 72, 153, 0.4)");

    return new ChartJS(ctx, {
      type: "radar",
      data: {
        labels: ["⏱ Time", "🧮 Solving", "🧩 Problem Solving"],
        datasets: [
          {
            label: `${title} Average`,
            data: [data.time, data.solving, data.problemSolving],
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
              font: { size: 14, weight: "bold" },
            },
          },
          title: {
            display: true,
            text: `${title} (All Students)`,
            color: "#1f2937",
            font: { size: 18, weight: "bold" },
          },
          tooltip: {
            enabled: true,
            backgroundColor: "rgba(0,0,0,0.8)",
            callbacks: {
              label: (ctx) => `${ctx.formattedValue}%`,
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
            suggestedMin: 0,
            suggestedMax: 100,
            grid: { color: "rgba(209,213,219,0.3)" },
            pointLabels: { color: "#111827", font: { size: 14, weight: "bold" } },
            ticks: { display: false },
          },
        },
      },
      plugins: [ChartDataLabels],
    });
  };

  useEffect(() => {
    if (!radarRefArithmetic.current || !radarRefPhysics.current) return;
    const ctxA = radarRefArithmetic.current.getContext("2d");
    const ctxP = radarRefPhysics.current.getContext("2d");
    if (!ctxA || !ctxP) return;

    if (chartArithmetic.current) chartArithmetic.current.destroy();
    if (chartPhysics.current) chartPhysics.current.destroy();

    chartArithmetic.current = createRadarChart(
      ctxA,
      arithmeticScore,
      "Arithmetic Sequence"
    );
    chartPhysics.current = createRadarChart(
      ctxP,
      physicsScore,
      "Uniform Motion in Physics"
    );

    return () => {
      chartArithmetic.current?.destroy();
      chartPhysics.current?.destroy();
    };
  }, [arithmeticScore, physicsScore]);

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen>
        <div style={{ padding: "20px" }}>
          <div
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {/* Arithmetic Sequence Radar */}
            <div
              style={{
                width: "500px",
                height: "600px",
                background: "white",
                borderRadius: "20px",
                boxShadow: "0px 8px 20px rgba(0,0,0,0.1)",
                padding: "20px",
              }}
            >
              <canvas ref={radarRefArithmetic} />
            </div>

            {/* Uniform Motion in Physics Radar */}
            <div
              style={{
                width: "500px",
                height: "600px",
                background: "white",
                borderRadius: "20px",
                boxShadow: "0px 8px 20px rgba(0,0,0,0.1)",
                padding: "20px",
              }}
            >
              <canvas ref={radarRefPhysics} />
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <button
              onClick={fetchAllData}
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
                maxWidth: "300px",
              }}
              onMouseOver={(e) =>
                ((e.target as HTMLButtonElement).style.transform = "scale(1.05)")
              }
              onMouseOut={(e) =>
                ((e.target as HTMLButtonElement).style.transform = "scale(1)")
              }
            >
              🔄 Refresh Both Subjects
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminRadar;
