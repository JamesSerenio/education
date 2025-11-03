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
import * as XLSX from "xlsx";
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

// 🧮 Performance constants
const MAX_SCORE = 15; // 15 questions total
const MAX_TIME = 525; // total 15s×5 + 30s×5 + 60s×5

interface UserScore {
  time: number;
  solving: number; // Word Problem
  problemSolving: number; // Problem Solving
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
  profiles?: {
    firstname?: string;
    lastname?: string;
    email?: string;
  };
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

  const [isRefreshing, setIsRefreshing] = useState(false);

  const mapToScoreWithQuizzes = (rawData: Record<string, unknown>): ScoreWithQuizzes => {
    const quiz = rawData.quizzes as Record<string, unknown> | null;
    const profiles = rawData.profiles as Record<string, unknown> | undefined;
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
      profiles: profiles
        ? {
            firstname: (profiles.firstname as string) || "",
            lastname: (profiles.lastname as string) || "",
            email: (profiles.email as string) || "",
          }
        : undefined,
    };
  };

  // ✅ Fetch average score per subject
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
      if (scores.length === 0) return { time: 0, solving: 0, problemSolving: 0 };

      // ✅ Compute time strictly for this subject (average time taken)
      const subjectTimes = scores
        .filter((s) => s.quizzes?.subject === subject && s.time_taken !== null)
        .map((s) => s.time_taken as number);

      const avgTime =
        subjectTimes.length > 0
          ? subjectTimes.reduce((sum, t) => sum + t, 0) / subjectTimes.length
          : 0;

      // ✅ Convert time into performance percentage (faster = higher)
      const timePercent = subjectTimes.length > 0
        ? Math.max(0, Math.min(100, ((MAX_TIME - avgTime) / MAX_TIME) * 100))
        : 0;

      // ✅ Word Problem category
      const wordProblems = scores.filter(
        (s) => s.quizzes?.category === "Word Problem" && s.score !== null
      );
      const wordProblemPercent =
        wordProblems.length > 0
          ? (wordProblems.reduce((sum, s) => sum + (s.score ?? 0), 0) /
              wordProblems.length /
              MAX_SCORE) *
            100
          : 0;

      // ✅ Problem Solving category
      const problemSolving = scores.filter(
        (s) => s.quizzes?.category === "Problem Solving" && s.score !== null
      );
      const problemSolvingPercent =
        problemSolving.length > 0
          ? (problemSolving.reduce((sum, s) => sum + (s.score ?? 0), 0) /
              problemSolving.length /
              MAX_SCORE) *
            100
          : 0;

      return {
        time: parseFloat(timePercent.toFixed(2)),
        solving: parseFloat(wordProblemPercent.toFixed(2)),
        problemSolving: parseFloat(problemSolvingPercent.toFixed(2)),
      };
    } catch (err) {
      console.error(`Error fetching ${subject} data:`, err);
      return { time: 0, solving: 0, problemSolving: 0 };
    }
  };

  const animateRadarUpdate = (
    setScore: React.Dispatch<React.SetStateAction<UserScore>>,
    newScore: UserScore,
    duration = 1000
  ) => {
    const steps = 30;
    const interval = duration / steps;

    setScore({ time: 0, solving: 0, problemSolving: 0 });
    let currentStep = 0;

    const start = { time: 0, solving: 0, problemSolving: 0 };

    const animate = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setScore({
        time: start.time + (newScore.time - start.time) * progress,
        solving: start.solving + (newScore.solving - start.solving) * progress,
        problemSolving:
          start.problemSolving +
          (newScore.problemSolving - start.problemSolving) * progress,
      });

      if (currentStep >= steps) clearInterval(animate);
    }, interval);
  };

  const fetchAllData = async () => {
    const arithmetic = await fetchSubjectData("Arithmetic Sequence");
    const physics = await fetchSubjectData("Uniform Motion in Physics");

    animateRadarUpdate(setArithmeticScore, arithmetic);
    animateRadarUpdate(setPhysicsScore, physics);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const fetchAllScores = async (): Promise<ScoreWithQuizzes[]> => {
    try {
      const { data, error } = await supabase
        .from("scores")
        .select(`
          id,
          score,
          time_taken,
          created_at,
          quiz_id,
          quizzes!quiz_id (subject, category),
          profiles!user_id (firstname, lastname, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapToScoreWithQuizzes);
    } catch (err) {
      console.error("Error fetching all scores:", err);
      return [];
    }
  };

  const exportAllToExcel = async () => {
    const allScores = await fetchAllScores();
    if (allScores.length === 0) return;

    const formatted = allScores.map((item) => ({
      "Full Name": `${item.profiles?.lastname || ""}, ${item.profiles?.firstname || ""}`.trim() || "N/A",
      Email: item.profiles?.email || "N/A",
      Subject: item.quizzes?.subject || "N/A",
      Category: item.quizzes?.category || "N/A",
      Score: item.score ?? 0,
      "Time Taken (s)": item.time_taken ?? 0,
      "Date Taken": new Date(item.created_at).toLocaleString(),
    }));

    const summarySection = [
      { "📊 AVERAGE SUMMARY": "" },
      {
        Subject: "Arithmetic Sequence",
        "⏱ Time (%)": `${arithmeticScore.time}%`,
        "🧩 Word Problem (%)": `${arithmeticScore.solving}%`,
        "🧮 Problem Solving (%)": `${arithmeticScore.problemSolving}%`,
      },
      {
        Subject: "Uniform Motion in Physics",
        "⏱ Time (%)": `${physicsScore.time}%`,
        "🧩 Word Problem (%)": `${physicsScore.solving}%`,
        "🧮 Problem Solving (%)": `${physicsScore.problemSolving}%`,
      },
      {},
      { "STUDENT QUIZ RESULTS": "" },
    ];

    const ws = XLSX.utils.json_to_sheet([...summarySection, {}, ...formatted]);
    ws["!cols"] = [
      { wch: 30 },
      { wch: 25 },
      { wch: 25 },
      { wch: 20 },
      { wch: 10 },
      { wch: 15 },
      { wch: 25 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Results");

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `All_Student_Results_${dateStr}.xlsx`);

    await fetchAllData();
  };

  const formatValue = (value: number): string => {
    return Number.isInteger(value) ? `${value}%` : `${value.toFixed(2)}%`;
  };

  const createRadarChart = (
    ctx: CanvasRenderingContext2D,
    data: UserScore,
    title: string
  ): ChartJS => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(54, 162, 235, 0.3)");
    gradient.addColorStop(1, "rgba(236, 72, 153, 0.3)");

    return new ChartJS(ctx, {
      type: "radar",
      data: {
        labels: ["⏱ Time", "🧩 Word Problem", "🧮 Problem Solving"],
        datasets: [
          {
            label: `${title} Average`,
            data: [data.time, data.solving, data.problemSolving],
            fill: true,
            backgroundColor: gradient,
            borderColor: "rgb(54, 162, 235)",
            borderWidth: 3,
            pointBackgroundColor: "rgb(236, 72, 153)",
            pointBorderColor: "#fff",
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
            text: `📊 (All Students) ${title}`,
            color: "#111",
            font: { size: 18, weight: "bold" },
          },
          datalabels: {
            color: "#000",
            font: { weight: "bold", size: 12 },
            formatter: (val: number) => formatValue(val),
          },
        },
        scales: {
          r: {
            suggestedMin: 0,
            suggestedMax: 100,
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

    chartArithmetic.current?.destroy();
    chartPhysics.current?.destroy();

    chartArithmetic.current = createRadarChart(ctxA, arithmeticScore, "Arithmetic Sequence");
    chartPhysics.current = createRadarChart(ctxP, physicsScore, "Uniform Motion in Physics");

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
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>

        <div
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "20px",
              width: "100%",
            }}
          >
            {/* 📘 Arithmetic Sequence */}
            <div
              style={{
                width: "100%",
                maxWidth: "500px",
                height: "60vh",
                background: "white",
                borderRadius: "16px",
                boxShadow: "0px 6px 18px rgba(0,0,0,0.08)",
                padding: "16px",
              }}
            >
              <canvas ref={radarRefArithmetic} />
            </div>

            {/* ⚙️ Uniform Motion in Physics */}
            <div
              style={{
                width: "100%",
                maxWidth: "500px",
                height: "60vh",
                background: "white",
                borderRadius: "16px",
                boxShadow: "0px 6px 18px rgba(0,0,0,0.08)",
                padding: "16px",
              }}
            >
              <canvas ref={radarRefPhysics} />
            </div>
          </div>

          {/* 🔄 Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(90deg, #6366F1, #EC4899)",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              borderRadius: "12px",
              border: "none",
              cursor: isRefreshing ? "wait" : "pointer",
              width: "100%",
              maxWidth: "250px",
              marginTop: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              opacity: isRefreshing ? 0.8 : 1,
              transition: "all 0.3s ease",
            }}
          >
            <span
              style={{
                display: "inline-block",
                animation: isRefreshing ? "spin 1s linear infinite" : "none",
                fontSize: "18px",
              }}
            >
              🔄
            </span>
            {isRefreshing ? "Refreshing..." : "Refresh Both Subjects"}
          </button>

          {/* 📘 Export Button */}
          <button
            onClick={exportAllToExcel}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(90deg, #0EA5E9, #2563EB)",
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
            📘 Export All Students Data
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminRadar;
