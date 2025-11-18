// admin_chart.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
  IonSpinner,
} from "@ionic/react";
import { refresh } from "ionicons/icons";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { supabase } from "../utils/supabaseClient";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

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

// For export: best row per user & subject
interface UserBestRow {
  subject: string;
  user_id: string;
  firstname: string;
  lastname: string;
  email: string;
  word_problem_score: number;
  problem_solving_score: number;
  best_time_seconds: number;
}

const AdminChart: React.FC = () => {
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
  const [isExporting, setIsExporting] = useState(false);

  // 🔹 I-store natin dito lahat ng best-per-user-per-subject
  const [userBestRows, setUserBestRows] = useState<UserBestRow[]>([]);

  const mapToScoreWithQuizzes = (
    rawData: Record<string, unknown>
  ): ScoreWithQuizzes => {
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
  const fetchSubjectData = async (
    subject: string
  ): Promise<{ avg: UserScore; bestRows: UserBestRow[] }> => {
    try {
      const { data, error } = await supabase
        .from("scores")
        .select(
          `
          id, total_score, time_taken, created_at, quiz_id, user_id,
          quizzes!inner (id, category, subject),
          profiles (firstname, lastname, email)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const scores: ScoreWithQuizzes[] = (data || []).map(
        mapToScoreWithQuizzes
      );

      const subjectScores = scores.filter(
        (s) => s.quizzes?.subject === subject
      );

      if (subjectScores.length === 0) {
        return {
          avg: { time: 0, solving: 0, problemSolving: 0 },
          bestRows: [],
        };
      }

      const userBests: Record<
        string,
        {
          wordProblem: number;
          problemSolving: number;
          time: number;
          firstname: string;
          lastname: string;
          email: string;
        }
      > = {};

      subjectScores.forEach((score) => {
        const userId = score.user_id;
        const firstname = score.profiles?.firstname || "";
        const lastname = score.profiles?.lastname || "";
        const email = score.profiles?.email || "";

        if (!userBests[userId]) {
          userBests[userId] = {
            wordProblem: 0,
            problemSolving: 0,
            time: MAX_TIME,
            firstname,
            lastname,
            email,
          };
        }

        if (
          score.quizzes?.category === "Word Problem" &&
          score.total_score !== null
        ) {
          userBests[userId].wordProblem = Math.max(
            userBests[userId].wordProblem,
            score.total_score
          );
        }
        if (
          score.quizzes?.category === "Problem Solving" &&
          score.total_score !== null
        ) {
          userBests[userId].problemSolving = Math.max(
            userBests[userId].problemSolving,
            score.total_score
          );
        }
        if (score.time_taken !== null) {
          userBests[userId].time = Math.min(
            userBests[userId].time,
            score.time_taken
          );
        }

        // Update name/email in case nauna yung walang profile
        if (firstname || lastname || email) {
          userBests[userId].firstname = firstname || userBests[userId].firstname;
          userBests[userId].lastname = lastname || userBests[userId].lastname;
          userBests[userId].email = email || userBests[userId].email;
        }
      });

      const users = Object.entries(userBests);
      if (users.length === 0) {
        return {
          avg: { time: 0, solving: 0, problemSolving: 0 },
          bestRows: [],
        };
      }

      const avgWordProblem =
        users.reduce((sum, [, u]) => sum + u.wordProblem, 0) /
        users.length;
      const avgProblemSolving =
        users.reduce((sum, [, u]) => sum + u.problemSolving, 0) /
        users.length;
      const avgTime =
        users.reduce((sum, [, u]) => sum + u.time, 0) / users.length;

      const timePercent = Math.max(
        0,
        Math.min(100, ((MAX_TIME - avgTime) / MAX_TIME) * 100)
      );
      const solvingPercent = (avgWordProblem / MAX_SCORE) * 100;
      const problemSolvingPercent =
        (avgProblemSolving / MAX_SCORE) * 100;

      const avg: UserScore = {
        time: parseFloat(timePercent.toFixed(2)),
        solving: parseFloat(solvingPercent.toFixed(2)),
        problemSolving: parseFloat(problemSolvingPercent.toFixed(2)),
      };

      const bestRows: UserBestRow[] = users.map(([user_id, u]) => ({
        subject,
        user_id,
        firstname: u.firstname,
        lastname: u.lastname,
        email: u.email,
        word_problem_score: u.wordProblem,
        problem_solving_score: u.problemSolving,
        best_time_seconds: u.time,
      }));

      return { avg, bestRows };
    } catch (err) {
      console.error(`Error fetching ${subject} data:`, err);
      return {
        avg: { time: 0, solving: 0, problemSolving: 0 },
        bestRows: [],
      };
    }
  };

  const animatePieUpdate = (
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
    const arithmeticResult = await fetchSubjectData("Arithmetic Sequence");
    const physicsResult = await fetchSubjectData("Uniform Motion in Physics");

    animatePieUpdate(setArithmeticScore, arithmeticResult.avg);
    animatePieUpdate(setPhysicsScore, physicsResult.avg);

    // I-merge natin lahat ng bestRows para sa export
    setUserBestRows([...arithmeticResult.bestRows, ...physicsResult.bestRows]);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // 🔹 CSV Export
  const handleExportCSV = () => {
    if (userBestRows.length === 0) {
      alert("No data to export yet.");
      return;
    }

    setIsExporting(true);

    const headers = [
      "Subject",
      "User ID",
      "First Name",
      "Last Name",
      "Email",
      "Word Problem Score",
      "Problem Solving Score",
      "Best Time (seconds)",
    ];

    const rows = userBestRows.map((row) => [
      row.subject,
      row.user_id,
      row.firstname,
      row.lastname,
      row.email,
      row.word_problem_score,
      row.problem_solving_score,
      row.best_time_seconds,
    ]);

    const csvContent =
      [headers, ...rows]
        .map((r) =>
          r
            .map((v) => {
              const value = v !== null && v !== undefined ? String(v) : "";
              // Escape double quotes
              const escaped = value.replace(/"/g, '""');
              return `"${escaped}"`;
            })
            .join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const now = new Date();
    const fileName = `alas_scores_export_${now
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-")}.csv`;

    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExporting(false);
  };

  // 🔹 Top Row: Per-subject pies
  const arithmeticData = {
    labels: ["Word Problem", "Problem Solving", "Time"],
    datasets: [
      {
        data: [
          arithmeticScore.solving,
          arithmeticScore.problemSolving,
          arithmeticScore.time,
        ],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
      },
    ],
  };

  const physicsData = {
    labels: ["Word Problem", "Problem Solving", "Time"],
    datasets: [
      {
        data: [
          physicsScore.solving,
          physicsScore.problemSolving,
          physicsScore.time,
        ],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
      },
    ],
  };

  const subjectOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Averages",
      },
    },
  };

  // 🔹 Bottom Row: 3 comparison pies
  const wordProblemData = {
    labels: ["Arithmetic Sequence", "Uniform Motion in Physics"],
    datasets: [
      {
        data: [arithmeticScore.solving, physicsScore.solving],
        backgroundColor: ["#FF6384", "#36A2EB"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB"],
      },
    ],
  };

  const problemSolvingData = {
    labels: ["Arithmetic Sequence", "Uniform Motion in Physics"],
    datasets: [
      {
        data: [
          arithmeticScore.problemSolving,
          physicsScore.problemSolving,
        ],
        backgroundColor: ["#FF6384", "#36A2EB"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB"],
      },
    ],
  };

  const timeData = {
    labels: ["Arithmetic Sequence", "Uniform Motion in Physics"],
    datasets: [
      {
        data: [arithmeticScore.time, physicsScore.time],
        backgroundColor: ["#FF6384", "#36A2EB"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB"],
      },
    ],
  };

  const comparisonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Comparison",
      },
    },
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonGrid>
          {/* 🔹 ROW 1: Per Subject Averages */}
          <IonRow>
            <IonCol size="12" sizeMd="6">
              <div
                style={{
                  height: "60vh",
                  background: "white",
                  borderRadius: "16px",
                  boxShadow: "0px 6px 18px rgba(0,0,0,0.08)",
                  padding: "16px",
                  margin: "10px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h3>Arithmetic Sequence Averages</h3>
                <div style={{ flex: 1, position: "relative" }}>
                  <Pie data={arithmeticData} options={subjectOptions} />
                </div>
              </div>
            </IonCol>

            <IonCol size="12" sizeMd="6">
              <div
                style={{
                  height: "60vh",
                  background: "white",
                  borderRadius: "16px",
                  boxShadow: "0px 6px 18px rgba(0,0,0,0.08)",
                  padding: "16px",
                  margin: "10px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h3>Uniform Motion in Physics Averages</h3>
                <div style={{ flex: 1, position: "relative" }}>
                  <Pie data={physicsData} options={subjectOptions} />
                </div>
              </div>
            </IonCol>
          </IonRow>

          {/* 🔹 ROW 2: Comparison Pies */}
          <IonRow>
            <IonCol size="12" sizeMd="4">
              <div
                style={{
                  height: "50vh",
                  background: "white",
                  borderRadius: "16px",
                  boxShadow: "0px 6px 18px rgba(0,0,0,0.08)",
                  padding: "16px",
                  margin: "10px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h3>Word Problem Comparison</h3>
                <div style={{ flex: 1, position: "relative" }}>
                  <Pie data={wordProblemData} options={comparisonOptions} />
                </div>
              </div>
            </IonCol>

            <IonCol size="12" sizeMd="4">
              <div
                style={{
                  height: "50vh",
                  background: "white",
                  borderRadius: "16px",
                  boxShadow: "0px 6px 18px rgba(0,0,0,0.08)",
                  padding: "16px",
                  margin: "10px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h3>Problem Solving Comparison</h3>
                <div style={{ flex: 1, position: "relative" }}>
                  <Pie
                    data={problemSolvingData}
                    options={comparisonOptions}
                  />
                </div>
              </div>
            </IonCol>

            <IonCol size="12" sizeMd="4">
              <div
                style={{
                  height: "50vh",
                  background: "white",
                  borderRadius: "16px",
                  boxShadow: "0px 6px 18px rgba(0,0,0,0.08)",
                  padding: "16px",
                  margin: "10px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h3>Time Taken Comparison</h3>
                <div style={{ flex: 1, position: "relative" }}>
                  <Pie data={timeData} options={comparisonOptions} />
                </div>
              </div>
            </IonCol>
          </IonRow>

          {/* 🔹 Buttons Row */}
          <IonRow>
            <IonCol
              size="12"
              className="ion-text-center"
              style={{ marginBottom: "12px" }}
            >
              <IonButton
                onClick={handleRefresh}
                disabled={isRefreshing}
                style={{ marginTop: "10px", marginRight: "8px" }}
              >
                {isRefreshing ? (
                  <IonSpinner name="crescent" />
                ) : (
                  <IonIcon icon={refresh} />
                )}
                {isRefreshing ? "Refreshing..." : "Refresh Both Subjects"}
              </IonButton>

              <IonButton
                color="secondary"
                onClick={handleExportCSV}
                disabled={isExporting || userBestRows.length === 0}
                style={{ marginTop: "10px" }}
              >
                {isExporting ? (
                  <IonSpinner name="crescent" />
                ) : (
                  <>Export CSV</>
                )}
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default AdminChart;
