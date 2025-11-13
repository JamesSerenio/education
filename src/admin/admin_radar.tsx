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

// 🔹 Updated constants
const MAX_SCORE = 15; // Total max score
const MAX_TIME = 2700; // Max time in seconds

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
  total_score: number | null;
  time_taken: number | null;
  created_at: string;
  quiz_id: string;
  user_id: string;
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
    const profiles = rawData.profiles as Record<string, unknown> | null;
    return {
      id: (rawData.id as string) || "",
      total_score: (rawData.total_score as number) ?? null,
      time_taken: (rawData.time_taken as number) ?? null,
      created_at: (rawData.created_at as string) || new Date().toISOString(),
      quiz_id: (rawData.quiz_id as string) || "",
      user_id: (rawData.user_id as string) || "",
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

// 🔹 Fetch and calculate averages by subject and category filters (using highest per user)
const fetchSubjectData = async (subject: string): Promise<UserScore> => {
  try {
    const { data, error } = await supabase
      .from("scores")
      .select(`
        id, total_score, time_taken, created_at, quiz_id, user_id,
        quizzes!inner (id, category, subject)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Map data correctly
    const scores: ScoreWithQuizzes[] = (data || []).map(mapToScoreWithQuizzes);

    // ✅ Filter only records for the specific subject
    const subjectScores = scores.filter(
      (s) => s.quizzes?.subject === subject
    );

    if (subjectScores.length === 0)
      return { time: 0, solving: 0, problemSolving: 0 };

    // ✅ Group by user_id and find the best (highest score, lowest time) per user per category
    const userBests: Record<string, { wordProblem: number; problemSolving: number; time: number }> = {};

    subjectScores.forEach((score) => {
      const userId = score.user_id;
      if (!userBests[userId]) {
        userBests[userId] = { wordProblem: 0, problemSolving: 0, time: MAX_TIME };
      }

      if (score.quizzes?.category === "Word Problem" && score.total_score !== null) {
        userBests[userId].wordProblem = Math.max(userBests[userId].wordProblem, score.total_score);
      }
      if (score.quizzes?.category === "Problem Solving" && score.total_score !== null) {
        userBests[userId].problemSolving = Math.max(userBests[userId].problemSolving, score.total_score);
      }
      if (score.time_taken !== null) {
        userBests[userId].time = Math.min(userBests[userId].time, score.time_taken);
      }
    });

    // ✅ Compute averages of the bests
    const users = Object.values(userBests);
    if (users.length === 0) return { time: 0, solving: 0, problemSolving: 0 };

    const avgWordProblem = users.reduce((sum, u) => sum + u.wordProblem, 0) / users.length;
    const avgProblemSolving = users.reduce((sum, u) => sum + u.problemSolving, 0) / users.length;
    const avgTime = users.reduce((sum, u) => sum + u.time, 0) / users.length;

    const timePercent = Math.max(0, Math.min(100, ((MAX_TIME - avgTime) / MAX_TIME) * 100));
    const solvingPercent = (avgWordProblem / MAX_SCORE) * 100;
    const problemSolvingPercent = (avgProblemSolving / MAX_SCORE) * 100;

    // ✅ Return averages of highest per user
    return {
      time: parseFloat(timePercent.toFixed(2)),
      solving: parseFloat(solvingPercent.toFixed(2)),
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
          total_score,
          time_taken,
          created_at,
          quiz_id,
          user_id,
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

    // Group by user, subject, category, take highest score and lowest time
    const userData: Record<string, Record<string, Record<string, { score: number; time: number; percent: number }>>> = {};

    allScores.forEach((score) => {
      const userId = score.user_id;
      const subject = score.quizzes?.subject || "N/A";
      const category = score.quizzes?.category || "N/A";
      const scoreVal = score.total_score ?? 0;
      const timeVal = score.time_taken ?? MAX_TIME;


      if (!userData[userId]) userData[userId] = {};
      if (!userData[userId][subject]) userData[userId][subject] = {};
      if (!userData[userId][subject][category]) {
        userData[userId][subject][category] = { score: 0, time: MAX_TIME, percent: 0 };
      }

      // Take highest score and lowest time
      userData[userId][subject][category].score = Math.max(userData[userId][subject][category].score, scoreVal);
      userData[userId][subject][category].time = Math.min(userData[userId][subject][category].time, timeVal);
      userData[userId][subject][category].percent = (userData[userId][subject][category].score / MAX_SCORE) * 100;
    });

    // Prepare data for Excel
    const arithmeticWordProblem: unknown[] = [];
    const arithmeticProblemSolving: unknown[] = [];
    const motionWordProblem: unknown[] = [];
    const motionProblemSolving: unknown[] = [];

    Object.keys(userData).forEach((userId) => {
      const user = allScores.find(s => s.user_id === userId);
      const fullName = `${user?.profiles?.lastname || ""}, ${user?.profiles?.firstname || ""}`.trim() || "N/A";
      const email = user?.profiles?.email || "N/A";

      if (userData[userId]["Arithmetic Sequence"]) {
        if (userData[userId]["Arithmetic Sequence"]["Word Problem"]) {
          arithmeticWordProblem.push({
            "Full Name": fullName,
            Email: email,
            Score: userData[userId]["Arithmetic Sequence"]["Word Problem"].score,
            "Percentage": `${userData[userId]["Arithmetic Sequence"]["Word Problem"].percent.toFixed(2)}%`,
            "Time Taken (s)": userData[userId]["Arithmetic Sequence"]["Word Problem"].time,
          });
        }
        if (userData[userId]["Arithmetic Sequence"]["Problem Solving"]) {
          arithmeticProblemSolving.push({
            "Full Name": fullName,
            Email: email,
            Score: userData[userId]["Arithmetic Sequence"]["Problem Solving"].score,
            "Percentage": `${userData[userId]["Arithmetic Sequence"]["Problem Solving"].percent.toFixed(2)}%`,
            "Time Taken (s)": userData[userId]["Arithmetic Sequence"]["Problem Solving"].time,
          });
        }
      }

      if (userData[userId]["Uniform Motion in Physics"]) {
        if (userData[userId]["Uniform Motion in Physics"]["Word Problem"]) {
          motionWordProblem.push({
            "Full Name": fullName,
            Email: email,
            Score: userData[userId]["Uniform Motion in Physics"]["Word Problem"].score,
            "Percentage": `${userData[userId]["Uniform Motion in Physics"]["Word Problem"].percent.toFixed(2)}%`,
            "Time Taken (s)": userData[userId]["Uniform Motion in Physics"]["Word Problem"].time,
          });
        }
        if (userData[userId]["Uniform Motion in Physics"]["Problem Solving"]) {
          motionProblemSolving.push({
            "Full Name": fullName,
            Email: email,
            Score: userData[userId]["Uniform Motion in Physics"]["Problem Solving"].score,
            "Percentage": `${userData[userId]["Uniform Motion in Physics"]["Problem Solving"].percent.toFixed(2)}%`,
            "Time Taken (s)": userData[userId]["Uniform Motion in Physics"]["Problem Solving"].time,
          });
        }
      }
    });

    // Summary for pie charts
    const arithmeticAvg = {
      "Word Problem (%)": arithmeticScore.solving,
      "Problem Solving (%)": arithmeticScore.problemSolving,
    };
    const motionAvg = {
      "Word Problem (%)": physicsScore.solving,
      "Problem Solving (%)": physicsScore.problemSolving,
    };

    // Structure the sheet
    const wsData = [
      { "ARITHMETIC SEQUENCE - WORD PROBLEM": "" },
      ...arithmeticWordProblem,
      {},
      { "ARITHMETIC SEQUENCE - PROBLEM SOLVING": "" },
      ...arithmeticProblemSolving,
      {},
      { "UNIFORM MOTION IN PHYSICS - WORD PROBLEM": "" },
      ...motionWordProblem,
      {},
      { "UNIFORM MOTION IN PHYSICS - PROBLEM SOLVING": "" },
      ...motionProblemSolving,
      {},
      { "PIE CHART DATA - ARITHMETIC SEQUENCE": "" },
      { Category: "Word Problem", Percentage: arithmeticAvg["Word Problem (%)"] },
      { Category: "Problem Solving", Percentage: arithmeticAvg["Problem Solving (%)"] },
      {},
      { "PIE CHART DATA - UNIFORM MOTION IN PHYSICS": "" },
      { Category: "Word Problem", Percentage: motionAvg["Word Problem (%)"] },
      { Category: "Problem Solving", Percentage: motionAvg["Problem Solving (%)"] },
    ];

    const ws = XLSX.utils.json_to_sheet(wsData);
    ws["!cols"] = [
      { wch: 30 },
      { wch: 25 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Detailed Results");

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `Detailed_Student_Results_${dateStr}.xlsx`);

    await fetchAllData();
  };

  const formatValue = (value: number): string =>
    Number.isInteger(value) ? `${value}%` : `${value.toFixed(2)}%`;

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
        labels: ["⏱ Time", "🧩 Problem Solving", "🧮 Word Problem"],
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
