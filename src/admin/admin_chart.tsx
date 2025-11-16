import React, { useEffect, useRef, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonContent,
} from "@ionic/react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import * as XLSX from "xlsx";
import { supabase } from "../utils/supabaseClient";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
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
  user_id: string; // Added user_id
  quizzes: Quiz | null;
  profiles?: {
    firstname?: string;
    lastname?: string;
    email?: string;
  };
}

const AdminChart: React.FC = () => {
  const pieRefArithmetic = useRef<HTMLCanvasElement | null>(null);
  const pieRefMotion = useRef<HTMLCanvasElement | null>(null);
  const pieRefTimeComparison = useRef<HTMLCanvasElement | null>(null);
  const pieRefWordProblem = useRef<HTMLCanvasElement | null>(null);
  const pieRefProblemSolving = useRef<HTMLCanvasElement | null>(null);

  const chartArithmetic = useRef<ChartJS | null>(null);
  const chartMotion = useRef<ChartJS | null>(null);
  const chartTimeComparison = useRef<ChartJS | null>(null);
  const chartWordProblem = useRef<ChartJS | null>(null);
  const chartProblemSolving = useRef<ChartJS | null>(null);

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
  const [wordProblemScore, setWordProblemScore] = useState<number>(0);
  const [problemSolvingScore, setProblemSolvingScore] = useState<number>(0);

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
      user_id: (rawData.user_id as string) || "", // Added user_id
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

  // 🔹 Fetch average for category
  const fetchCategoryData = async (category: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from("scores")
        .select(`
          id, total_score, user_id,
          quizzes!inner (category)
        `);

      if (error) throw error;

      const scores: ScoreWithQuizzes[] = (data || []).map(mapToScoreWithQuizzes);

      const categoryScores = scores.filter(
        (s) => s.quizzes?.category === category && s.total_score !== null
      );

      if (categoryScores.length === 0) return 0;

      // Group by user_id and take highest score per user
      const userMaxScores: Record<string, number> = {};
      categoryScores.forEach((score) => {
        const userId = score.user_id;
        if (!userMaxScores[userId] || score.total_score! > userMaxScores[userId]) {
          userMaxScores[userId] = score.total_score!;
        }
      });

      const avgScore = Object.values(userMaxScores).reduce((sum, score) => sum + score, 0) / Object.keys(userMaxScores).length;
      return parseFloat(((avgScore / MAX_SCORE) * 100).toFixed(2));
    } catch (err) {
      console.error(`Error fetching ${category} data:`, err);
      return 0;
    }
  };

  const animateUpdate = (
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

  const animateNumber = (
    setValue: React.Dispatch<React.SetStateAction<number>>,
    newValue: number,
    duration = 1000
  ) => {
    const steps = 30;
    const interval = duration / steps;

    setValue(0);
    let currentStep = 0;
    const start = 0;

    const animate = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setValue(start + (newValue - start) * progress);

      if (currentStep >= steps) clearInterval(animate);
    }, interval);
  };

  const fetchAllData = async () => {
    const arithmetic = await fetchSubjectData("Arithmetic Sequence");
    const physics = await fetchSubjectData("Uniform Motion in Physics");
    const wordProblem = await fetchCategoryData("Word Problem");
    const problemSolving = await fetchCategoryData("Problem Solving");

    animateUpdate(setArithmeticScore, arithmetic);
    animateUpdate(setPhysicsScore, physics);
    animateNumber(setWordProblemScore, wordProblem);
    animateNumber(setProblemSolvingScore, problemSolving);
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

    const formatted = allScores.map((item) => ({
      "Full Name": `${item.profiles?.lastname || ""}, ${item.profiles?.firstname || ""}`.trim() || "N/A",
      Email: item.profiles?.email || "N/A",
      Subject: item.quizzes?.subject || "N/A",
      Category: item.quizzes?.category || "N/A",
      Score: item.total_score ?? 0,
      "Time Taken (s)": item.time_taken ?? 0,
      "Date Taken": new Date(item.created_at).toLocaleString(),
    }));

    const summarySection = [
      { "📊 AVERAGE SUMMARY": "" },
      {
        Subject: "Arithmetic Sequence",
        "⏱ Time (%)": `${arithmeticScore.time}%`,
        "🧩 Problem Solving (%)": `${arithmeticScore.problemSolving}%`,
        "🧮 Word Problem (%)": `${arithmeticScore.solving}%`,
      },
      {
        Subject: "Uniform Motion in Physics",
        "⏱ Time (%)": `${physicsScore.time}%`,
        "🧩 Problem Solving (%)": `${physicsScore.problemSolving}%`,
        "🧮 Word Problem (%)": `${physicsScore.solving}%`,
      },
      {
        Category: "Word Problem",
        "Average Score (%)": `${wordProblemScore}%`,
      },
      {
        Category: "Problem Solving",
        "Average Score (%)": `${problemSolvingScore}%`,
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
      { wch: 25 }
    ];
  
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Results");

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `All_Student_Results_${dateStr}.xlsx`);

    await fetchAllData();
  };

  const formatValue = (value: number): string =>
    Number.isInteger(value) ? `${value}%` : `${value.toFixed(2)}%`;

  const createPieChart = (
    ctx: CanvasRenderingContext2D,
    data: UserScore,
    title: string
  ): ChartJS => {
    return new ChartJS(ctx, {
      type: "pie",
      data: {
        labels: ["⏱ Time", "🧩 Problem Solving", "🧮 Word Problem"],
        datasets: [
          {
            data: [data.time, data.problemSolving, data.solving],
            backgroundColor: [
              "rgba(54, 162, 235, 0.8)",
              "rgba(255, 99, 132, 0.8)",
              "rgba(75, 192, 192, 0.8)",
            ],
            borderColor: [
              "rgba(54, 162, 235, 1)",
              "rgba(255, 99, 132, 1)",
              "rgba(75, 192, 192, 1)",
            ],
            borderWidth: 2,
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
            text: `📊 ${title}`,
            color: "#111",
            font: { size: 18, weight: "bold" },
          },
          datalabels: {
            color: "#fff",
            font: { weight: "bold", size: 12 },
            formatter: (val: number) => formatValue(val),
          },
        },
      },
      plugins: [ChartDataLabels],
    });
  };

  const createTimeComparisonPieChart = (
    ctx: CanvasRenderingContext2D,
    arithmeticTime: number,
    physicsTime: number
  ): ChartJS => {
    return new ChartJS(ctx, {
      type: "pie",
      data: {
        labels: ["Arithmetic Sequence Time (%)", "Uniform Motion in Physics Time (%)"],
        datasets: [
          {
            data: [arithmeticTime, physicsTime],
            backgroundColor: [
              "rgba(54, 162, 235, 0.8)",
              "rgba(255, 99, 132, 0.8)",
            ],
            borderColor: [
              "rgba(54, 162, 235, 1)",
              "rgba(255, 99, 132, 1)",
            ],
            borderWidth: 2,
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
            text: "📊 Arithmetic vs Motion - Time Performance",
            color: "#111",
            font: { size: 18, weight: "bold" },
          },
          datalabels: {
            color: "#fff",
            font: { weight: "bold", size: 12 },
            formatter: (val: number) => formatValue(val),
          },
        },
      },
      plugins: [ChartDataLabels],
    });
  };

  const createCategoryPieChart = (
    ctx: CanvasRenderingContext2D,
    score: number,
    title: string
  ): ChartJS => {
    const remaining = 100 - score;
    return new ChartJS(ctx, {
      type: "pie",
      data: {
        labels: [`${title} (%)`, "Remaining (%)"],
        datasets: [
          {
            data: [score, remaining],
            backgroundColor: [
              "rgba(75, 192, 192, 0.8)",
              "rgba(255, 206, 86, 0.8)",
            ],
            borderColor: [
              "rgba(75, 192, 192, 1)",
              "rgba(255, 206, 86, 1)",
            ],
            borderWidth: 2,
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
            text: `📊 ${title}`,
            color: "#111",
            font: { size: 18, weight: "bold" },
          },
          datalabels: {
            color: "#fff",
            font: { weight: "bold", size: 12 },
            formatter: (val: number) => formatValue(val),
          },
        },
      },
      plugins: [ChartDataLabels],
    });
  };

  useEffect(() => {
    if (!pieRefArithmetic.current || !pieRefMotion.current || !
      pieRefTimeComparison.current || !pieRefWordProblem.current || !pieRefProblemSolving.current) return;
    const ctxA = pieRefArithmetic.current.getContext("2d");
    const ctxM = pieRefMotion.current.getContext("2d");
    const ctxT = pieRefTimeComparison.current.getContext("2d");
    const ctxW = pieRefWordProblem.current.getContext("2d");
    const ctxP = pieRefProblemSolving.current.getContext("2d");
    if (!ctxA || !ctxM || !ctxT || !ctxW || !ctxP) return;

    chartArithmetic.current?.destroy();
    chartMotion.current?.destroy();
    chartTimeComparison.current?.destroy();
    chartWordProblem.current?.destroy();
    chartProblemSolving.current?.destroy();

    chartArithmetic.current = createPieChart(ctxA, arithmeticScore, "Arithmetic Sequence");
    chartMotion.current = createPieChart(ctxM, physicsScore, "Uniform Motion in Physics");
    chartTimeComparison.current = createTimeComparisonPieChart(ctxT, arithmeticScore.time, physicsScore.time);
    chartWordProblem.current = createCategoryPieChart(ctxW, wordProblemScore, "Word Problem");
    chartProblemSolving.current = createCategoryPieChart(ctxP, problemSolvingScore, "Problem Solving");

    return () => {
      chartArithmetic.current?.destroy();
      chartMotion.current?.destroy();
      chartTimeComparison.current?.destroy();
      chartWordProblem.current?.destroy();
      chartProblemSolving.current?.destroy();
    };
  }, [arithmeticScore, physicsScore, wordProblemScore, problemSolvingScore]);

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
                maxWidth: "400px",
                height: "50vh",
                background: "white",
                borderRadius: "16px",
                boxShadow: "0px 6px 18px rgba(0,0,0,0.08)",
                padding: "16px",
              }}
            >
              <canvas ref={pieRefArithmetic} />
            </div>

            <div
              style={{
                width: "100%",
                maxWidth: "400px",
                height: "50vh",
                background: "white",
                borderRadius: "16px",
                boxShadow: "0px 6px 18px rgba(0,0,0,0.08)",
                padding: "16px",
              }}
            >
              <canvas ref={pieRefMotion} />
            </div>

            <div
              style={{
                width: "100%",
                maxWidth: "400px",
                height: "50vh",
                background: "white",
                borderRadius: "16px",
                boxShadow: "0px 6px 18px rgba(0,0,0,0.08)",
                padding: "16px",
              }}
            >
              <canvas ref={pieRefTimeComparison} />
            </div>

            <div
              style={{
                width: "100%",
                maxWidth: "400px",
                height: "50vh",
                background: "white",
                borderRadius: "16px",
                boxShadow: "0px 6px 18px rgba(0,0,0,0.08)",
                padding: "16px",
              }}
            >
              <canvas ref={pieRefWordProblem} />
            </div>

            <div
              style={{
                width: "100%",
                maxWidth: "400px",
                height: "50vh",
                background: "white",
                borderRadius: "16px",
                boxShadow: "0px 6px 18px rgba(0,0,0,0.08)",
                padding: "16px",
              }}
            >
              <canvas ref={pieRefProblemSolving} />
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
            {isRefreshing ? "Refreshing..." : "Refresh All Charts"}
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
            📘 Export All Data
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminChart;
