// admin_chart.tsx
import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
  IonSpinner,
} from "@ionic/react";
import { refresh } from "ionicons/icons"; // Removed download icon
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
// Removed XLSX import
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
  user_id: string; // Added user_id
  quizzes: Quiz | null;
  profiles?: {
    firstname?: string;
    lastname?: string;
    email?: string;
  };
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
        : undefined, // Fixed: removed trailing comma and set to undefined
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
    const arithmetic = await fetchSubjectData("Arithmetic Sequence");
    const physics = await fetchSubjectData("Uniform Motion in Physics");

    animatePieUpdate(setArithmeticScore, arithmetic);
    animatePieUpdate(setPhysicsScore, physics);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  // Removed fetchAllScores and exportAllToExcel functions

  useEffect(() => {
    fetchAllData();
  }, []);

  // Data for Arithmetic Sequence Pie Chart
  const arithmeticData = {
    labels: ['Word Problem', 'Problem Solving', 'Time'],
    datasets: [
      {
        data: [arithmeticScore.solving, arithmeticScore.problemSolving, arithmeticScore.time],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  // Data for Physics Pie Chart
  const physicsData = {
    labels: ['Word Problem', 'Problem Solving', 'Time'],
    datasets: [
      {
        data: [physicsScore.solving, physicsScore.problemSolving, physicsScore.time],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allow chart to fit container
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Averages',
      },
    },
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Charts</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonGrid>
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
                  overflow: "hidden", // Prevent overflow
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h3>Arithmetic Sequence Averages</h3>
                <div style={{ flex: 1, position: "relative" }}>
                  <Pie data={arithmeticData} options={options} />
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
                  overflow: "hidden", // Prevent overflow
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h3>Uniform Motion in Physics Averages</h3>
                <div style={{ flex: 1, position: "relative" }}>
                  <Pie data={physicsData} options={options} />
                </div>
              </div>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="12" className="ion-text-center">
              <IonButton
                onClick={handleRefresh}
                disabled={isRefreshing}
                style={{
                  marginTop: "10px",
                }}
              >
                {isRefreshing ? <IonSpinner name="crescent" /> : <IonIcon icon={refresh} />}
                {isRefreshing ? "Refreshing..." : "Refresh Both Subjects"}
              </IonButton>
            </IonCol>
          </IonRow>
          {/* Removed the IonRow and IonCol for the export button */}
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default AdminChart;
