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

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

ChartJS.register(ArcElement, Tooltip, Legend);

const MAX_SCORE = 15;
const MAX_TIME = 2700;

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
  const [isExportingPDF, setIsExportingPDF] = useState(false);

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

      const scores: ScoreWithQuizzes[] = (data || []).map(
        mapToScoreWithQuizzes
      );

      const subjectScores = scores.filter(
        (s) => s.quizzes?.subject === subject
      );

      if (subjectScores.length === 0)
        return { time: 0, solving: 0, problemSolving: 0 };

      const userBests: Record<
        string,
        { wordProblem: number; problemSolving: number; time: number }
      > = {};

      subjectScores.forEach((score) => {
        const userId = score.user_id;
        if (!userBests[userId]) {
          userBests[userId] = {
            wordProblem: 0,
            problemSolving: 0,
            time: MAX_TIME,
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
      });

      const users = Object.values(userBests);
      if (users.length === 0)
        return { time: 0, solving: 0, problemSolving: 0 };

      const avgWordProblem =
        users.reduce((sum, u) => sum + u.wordProblem, 0) /
        users.length;
      const avgProblemSolving =
        users.reduce((sum, u) => sum + u.problemSolving, 0) /
        users.length;
      const avgTime =
        users.reduce((sum, u) => sum + u.time, 0) / users.length;

      const timePercent = Math.max(
        0,
        Math.min(100, ((MAX_TIME - avgTime) / MAX_TIME) * 100)
      );
      const solvingPercent = (avgWordProblem / MAX_SCORE) * 100;
      const problemSolvingPercent =
        (avgProblemSolving / MAX_SCORE) * 100;

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

  useEffect(() => {
    fetchAllData();
  }, []);

  // ✅ Export PDF – neatly fitted to one A4 bond paper
  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);

      const container = document.getElementById("pdf-root");
      if (!container) {
        console.error("PDF root container not found");
        setIsExportingPDF(false);
        return;
      }

      // temporarily remove scrollbars from container (optional)
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
      });

      document.body.style.overflow = originalOverflow;

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("portrait", "mm", "a4"); // portrait bond paper

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

      // Maglagay ng margin (halimbawa 10mm)
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      const imgWidth = usableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let renderHeight = imgHeight;
      let renderY = margin;

      if (imgHeight > usableHeight) {
        // kung masyadong mataas, i-scale pa para kasya talaga sa isang page
        const scale = usableHeight / imgHeight;
        renderHeight = imgHeight * scale;
      }

      // optional title
      pdf.setFontSize(14);
      pdf.text("ALAS Dashboard – Pie Chart Summary", pageWidth / 2, 12, {
        align: "center",
      });

      pdf.setFontSize(10);
      pdf.text(
        `Generated: ${new Date().toLocaleString()}`,
        pageWidth / 2,
        18,
        { align: "center" }
      );

      // adjust image a bit lower para di sumabit sa title
      renderY = 24;

      pdf.addImage(
        imgData,
        "PNG",
        margin,
        renderY,
        imgWidth,
        renderHeight,
        undefined,
        "FAST"
      );

      pdf.save("alas_dashboard_charts.pdf");
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // ─── Chart Data ─────────────────────────────────────────────
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

  // ─── UI Layout ─────────────────────────────────────────────
  return (
    <IonPage>
      <IonContent fullscreen>
        {/* ✅ Ito lang ang kukunin para sa PDF (parang isang bond paper) */}
        <div
          id="pdf-root"
          style={{
            maxWidth: "900px",
            margin: "16px auto",
            background: "#f5f5f5",
            padding: "12px",
            borderRadius: "12px",
          }}
        >
          <IonGrid>
            {/* Row 1: dalawang malalaking pie */}
            <IonRow>
              <IonCol size="12" sizeMd="6">
                <div
                  style={{
                    height: "260px",
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0px 4px 10px rgba(0,0,0,0.08)",
                    padding: "12px",
                    margin: "6px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <h4 style={{ margin: "0 0 8px 0" }}>
                    Arithmetic Sequence Averages
                  </h4>
                  <div style={{ flex: 1, position: "relative" }}>
                    <Pie data={arithmeticData} options={subjectOptions} />
                  </div>
                </div>
              </IonCol>

              <IonCol size="12" sizeMd="6">
                <div
                  style={{
                    height: "260px",
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0px 4px 10px rgba(0,0,0,0.08)",
                    padding: "12px",
                    margin: "6px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <h4 style={{ margin: "0 0 8px 0" }}>
                    Uniform Motion in Physics Averages
                  </h4>
                  <div style={{ flex: 1, position: "relative" }}>
                    <Pie data={physicsData} options={subjectOptions} />
                  </div>
                </div>
              </IonCol>
            </IonRow>

            {/* Row 2: tatlong smaller pies */}
            <IonRow>
              <IonCol size="12" sizeMd="4">
                <div
                  style={{
                    height: "220px",
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0px 4px 10px rgba(0,0,0,0.08)",
                    padding: "12px",
                    margin: "6px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <h5 style={{ margin: "0 0 6px 0" }}>Word Problem Comparison</h5>
                  <div style={{ flex: 1, position: "relative" }}>
                    <Pie data={wordProblemData} options={comparisonOptions} />
                  </div>
                </div>
              </IonCol>

              <IonCol size="12" sizeMd="4">
                <div
                  style={{
                    height: "220px",
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0px 4px 10px rgba(0,0,0,0.08)",
                    padding: "12px",
                    margin: "6px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <h5 style={{ margin: "0 0 6px 0" }}>
                    Problem Solving Comparison
                  </h5>
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
                    height: "220px",
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0px 4px 10px rgba(0,0,0,0.08)",
                    padding: "12px",
                    margin: "6px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <h5 style={{ margin: "0 0 6px 0" }}>Time Taken Comparison</h5>
                  <div style={{ flex: 1, position: "relative" }}>
                    <Pie data={timeData} options={comparisonOptions} />
                  </div>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>

        {/* Buttons Row (hindi sinasama sa PDF) */}
        <IonGrid>
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
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                style={{ marginTop: "10px" }}
              >
                {isExportingPDF ? (
                  <IonSpinner name="crescent" />
                ) : (
                  <>Export PDF</>
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
