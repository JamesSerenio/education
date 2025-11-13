import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from "@ionic/react";
import { supabase } from "../../utils/supabaseClient";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

interface ScoreWithRelations {
  user_id: string;
  quiz_id: string;
  easy: number;
  average: number;
  difficult: number;
  total_score: number;
  time_taken: number;
  created_at: string;
  profiles: {
    firstname: string;
    lastname: string;
  };
  quizzes: {
    category: "Word Problem" | "Problem Solving";
    subject: string;
  };
}

interface ProgressRow {
  user_id: string;
  lastname: string;
  category: "Word Problem" | "Problem Solving";
  scores: number[]; // total_score for each quiz
}

interface LeaderboardRow {
  user_id: string;
  firstname: string;
  lastname: string;
  category: "Word Problem" | "Problem Solving";
  easy_total: number;
  average_total: number;
  difficult_total: number;
  overall_total: number;
  quizzes_taken: number;
}

const ArithmeticProgress: React.FC = () => {
  const [progressData, setProgressData] = useState<ProgressRow[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: fetchedData, error } = await supabase
        .from("scores")
        .select(`
          *,
          profiles (firstname, lastname),
          quizzes!inner (category, subject)
        `)
        .eq("quizzes.subject", "Arithmetic Sequence")
        .in("quizzes.category", ["Word Problem", "Problem Solving"])
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching data:", error);
        setProgressData([]);
        setLeaderboardData([]);
        return;
      }

      // For progress: group by user and category, collect total_score for each quiz
      const progressMap = new Map<string, ProgressRow>();
      (fetchedData as ScoreWithRelations[]).forEach((row) => {
        const key = `${row.user_id}-${row.quizzes.category}`;
        const existing = progressMap.get(key);
        if (existing) {
          existing.scores.push(row.total_score || (row.easy + row.average + row.difficult));
        } else {
          progressMap.set(key, {
            user_id: row.user_id,
            lastname: row.profiles.lastname,
            category: row.quizzes.category,
            scores: [row.total_score || (row.easy + row.average + row.difficult)],
          });
        }
      });
      const progressRows = Array.from(progressMap.values());
      setProgressData(progressRows);

      // For leaderboard: aggregate as before
      const rows: LeaderboardRow[] = (fetchedData as ScoreWithRelations[]).map((row) => ({
        user_id: row.user_id,
        firstname: row.profiles.firstname,
        lastname: row.profiles.lastname,
        category: row.quizzes.category,
        easy_total: row.easy,
        average_total: row.average,
        difficult_total: row.difficult,
        overall_total: row.total_score || (row.easy + row.average + row.difficult),
        quizzes_taken: 1,
      }));

      const aggregated = new Map<string, LeaderboardRow>();
      rows.forEach((row) => {
        const key = `${row.user_id}-${row.category}`;
        const existing = aggregated.get(key);
        if (existing) {
          existing.easy_total = Math.max(existing.easy_total, row.easy_total);
          existing.average_total = Math.max(existing.average_total, row.average_total);
          existing.difficult_total = Math.max(existing.difficult_total, row.difficult_total);
          existing.overall_total = Math.max(existing.overall_total, row.overall_total);
          existing.quizzes_taken += 1;
        } else {
          aggregated.set(key, { ...row });
        }
      });
      const aggregatedRows = Array.from(aggregated.values());
      setLeaderboardData(aggregatedRows);
    } catch (err) {
      console.error("Unexpected fetch error:", err);
      setProgressData([]);
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderLineChart = (category: "Word Problem" | "Problem Solving") => {
    const filtered = progressData.filter((d) => d.category === category);
    const maxQuizzes = filtered.reduce((max, user) => Math.max(max, user.scores.length), 0);

    const chartData = {
      labels: Array.from({ length: maxQuizzes }, (_, i) => `Quiz ${i + 1}`),
      datasets: filtered.map((user, idx) => ({
        label: user.lastname,
        data: user.scores,
        borderColor: `rgba(${(idx * 50) % 255}, ${(idx * 80) % 255}, ${(idx * 120) % 255}, 1)`,
        backgroundColor: `rgba(${(idx * 50) % 255}, ${(idx * 80) % 255}, ${(idx * 120) % 255}, 0.2)`,
        tension: 0.1,
      })),
    };

    const options = {
      responsive: true,
      plugins: {
        legend: { position: "top" as const },
        title: { display: true, text: `${category} Progress` },
      },
      scales: {
        y: { beginAtZero: true, max: 15 }, // Assuming max score is 15
      },
    };

    return <Line data={chartData} options={options} />;
  };

  const renderQuizzesTaken = (category: "Word Problem" | "Problem Solving") => {
    const rows = leaderboardData
      .filter(r => r.category === category)
      .sort((a, b) => b.quizzes_taken - a.quizzes_taken);

    return (
      <div className="quizzes-taken-wrapper">
        <h3>Quizzes Taken - {category}</h3>
        <table className="quizzes-taken-table">
          <thead>
            <tr>
              <th>Lastname</th>
              <th>Quizzes Taken</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={`${row.user_id}-${row.category}`}>
                  <td>{row.lastname}</td>
                  <td>{row.quizzes_taken}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2}>No data found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <IonPage className="progress-page">
      <IonHeader className="progress-toolbar">
        <IonToolbar>
          <IonTitle className="progress-title">Arithmetic Progress</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="progress-card">
          <h2 className="progress-heading">Your Progress</h2>

          {loading ? (
            <p className="progress-loading">Loading...</p>
          ) : (
            <>
              <div className="progress-chart">
                <h3>Word Problem</h3>
                {renderLineChart("Word Problem")}
              </div>
              <div className="progress-chart">
                <h3>Problem Solving</h3>
                {renderLineChart("Problem Solving")}
              </div>
              <div className="quizzes-taken-section">
                {renderQuizzesTaken("Word Problem")}
                {renderQuizzesTaken("Problem Solving")}
              </div>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ArithmeticProgress;
