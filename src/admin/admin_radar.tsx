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

  // ✅ Mapping function (no any)
  const mapToScoreWithQuizzes = (rawData: Record<string, unknown>): ScoreWithQuizzes => {
    const quiz = rawData.quizzes as Record<string, unknown> | null;

    return {
      id: (rawData.id as string) || "",
      score: (rawData.score as number) ?? null,
      time_taken: (rawData.time_taken as number) ?? null,
      created_at: (rawData.created_at as string) || new Date().toISOString(),
      quiz_id: (rawData.quiz_id as string) || "",
      quizzes: quiz
        ? {
            id: (quiz.id as string) || "",
            category: (quiz.category as string) || "",
            subject: (quiz.subject as string) || "",
          }
        : null,
    };
  };

  // ✅ Fetch data per subject (filtered properly)
  const fetchSubjectData = async (subject: string): Promise<UserScore> => {
    try {
      const { data, error } = await supabase
        .from("scores")
        .select(`
          id, score, time_taken, created_at, quiz_id,
          quizzes!quiz_id (id, category, subject)
        `)
        .eq("quizzes.subject", subject)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const scores: ScoreWithQuizzes[] = (data || []).map(mapToScoreWithQuizzes);

      if (scores.length === 0) {
        return { time: 0, solving: 0, problemSolving: 0 };
      }

      // ✅ Filter strictly by subject
      const subjectScores = scores.filter(
        (s) => s.quizzes?.subject === subject
      );

      // ✅ TIME → Decimal (average of all time_taken)
      const avgTime =
        subjectScores.reduce((sum, s) => sum + (s.time_taken || 0), 0) /
        subjectScores.length;
      const timePercent = Math.max(
        0,
        Math.min(100, parseFloat((((MAX_TIME - avgTime) / MAX_TIME) * 100).toFixed(2)))
      );

      // ✅ SOLVING → Whole number
      const solvingScores = subjectScores.filter(
        (s) => s.quizzes?.category === "Solving" && s.score !== null
      );
      const solvingPercent =
        solvingScores.length > 0
          ? Math.floor(
              (solvingScores.reduce((sum, s) => sum + (s.score || 0), 0) /
                solvingScores.length /
                MAX_SCORE) *
                100
            )
          : 0;

      // ✅ PROBLEM SOLVING → Whole number
      const problemScores = subjectScores.filter(
        (s) => s.quizzes?.category === "Problem Solving" && s.score !== null
      );
      const problemSolvingPercent =
        problemScores.length > 0
          ? Math.floor(
              (problemScores.reduce((sum, s) => sum + (s.score || 0), 0) /
                problemScores.length /
                MAX_SCORE) *
                100
            )
          : 0;

      return {
        time: timePercent,
        solving: solvingPercent,
        problemSolving: problemSolvingPercent,
      };
    } catch (err) {
      console.error(`Error fetching ${subject} data:`, err);
      return { time: 0, solving: 0, problemSolving: 0 };
    }
  };

  // ✅ Fetch both subjects separately
  const fetchAllData = async () => {
    const arithmetic = await fetchSubjectData("Arithmetic Sequence");
    const physics = await fetchSubjectData("Uniform Motion in Physics");
    setArithmeticScore(arithmetic);
    setPhysicsScore(physics);
  };

  // ✅ Create radar chart (consistent styling)
  const createRadarChart = (
    ctx: CanvasRenderingContext2D,
    data: UserScore,
    title: string
  ) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(54, 162, 235, 0.3)");
    gradient.addColorStop(1, "rgba(236, 72, 153, 0.3)");

    return new ChartJS(ctx, {
      type: "radar",
      data: {
        labels: ["⏱ Time", "🧩 Problem Solving", "🧮 Solving"],
        datasets: [
          {
            label: `${title} Average`,
            data: [data.time, data.problemSolving, data.solving],
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
            text: `📊(All Students) ${title}`,
            color: "#111",
            font: { size: 20, weight: "bold" },
          },
          datalabels: {
            color: "#000",
            font: { weight: "bold", size: 12 },
            formatter: (val, ctx) =>
              ctx.dataIndex === 0
                ? `${val.toFixed(2)}%` // Time has decimals
                : `${Math.round(val)}%`, // Others are whole
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
  };

  // ✅ Render both charts
  useEffect(() => {
    if (!radarRefArithmetic.current || !radarRefPhysics.current) return;

    const ctxA = radarRefArithmetic.current.getContext("2d");
    const ctxP = radarRefPhysics.current.getContext("2d");
    if (!ctxA || !ctxP) return;

    chartArithmetic.current?.destroy();
    chartPhysics.current?.destroy();

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
            {/* Arithmetic Sequence Chart */}
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

            {/* Uniform Motion in Physics Chart */}
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
                width: "100%",
                maxWidth: "250px",
              }}
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
