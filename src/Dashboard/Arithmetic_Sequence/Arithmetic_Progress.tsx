import React, { useEffect, useState } from "react";
import {
  IonPage,
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
  TooltipItem,
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
  scores: { score: number; date: string }[]; // Updated to include date
}

const ArithmeticProgress: React.FC = () => {
  const [progressData, setProgressData] = useState<ProgressRow[]>([]);
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
        return;
      }

      // For progress: group by user and category, collect total_score and created_at for each quiz
      const progressMap = new Map<string, ProgressRow>();
      (fetchedData as ScoreWithRelations[]).forEach((row) => {
        const key = `${row.user_id}-${row.quizzes.category}`;
        const existing = progressMap.get(key);
        const score = row.total_score || (row.easy + row.average + row.difficult);
        if (existing) {
          existing.scores.push({ score, date: row.created_at });
        } else {
          progressMap.set(key, {
            user_id: row.user_id,
            lastname: row.profiles.lastname,
            category: row.quizzes.category,
            scores: [{ score, date: row.created_at }],
          });
        }
      });
      const progressRows = Array.from(progressMap.values());
      setProgressData(progressRows);
    } catch (err) {
      console.error("Unexpected fetch error:", err);
      setProgressData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderLineChart = (category: "Word Problem" | "Problem Solving") => {
    const filtered = progressData.filter((d) => d.category === category);
    const maxQuizzes = filtered.reduce((max, user) => Math.max(max, user.scores.length), 0);
    const maxScore = filtered.length > 0 ? Math.max(...filtered.flatMap(u => u.scores.map(s => s.score))) : 15; // Dynamic max, default to 15 if no data

    const chartData = {
      labels: Array.from({ length: maxQuizzes }, (_, i) => `Quiz ${i + 1}`),
      datasets: filtered.map((user) => ({
        label: user.lastname,
        data: user.scores.map(s => s.score),
        borderColor: 'red', // Changed to red for uniform beauty
        backgroundColor: 'rgba(255, 0, 0, 0.2)', // Light red background for uniformity
        tension: 0.1,
      })),
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" as const },
        title: { display: true, text: `${category} Progress` },
        tooltip: {
          callbacks: {
            label: function(context: TooltipItem<'line'>) {
              const datasetIndex = context.datasetIndex;
              const dataIndex = context.dataIndex;
              const user = filtered[datasetIndex];
              const item = user.scores[dataIndex];
              const date = new Date(item.date).toLocaleString();
              return `${context.dataset.label}: ${context.parsed.y} (Date: ${date})`;
            },
          },
        },
      },
      scales: {
        y: { beginAtZero: true, max: maxScore },
      },
    };

    return <Line data={chartData} options={options} />;
  };

  return (
    <IonPage className="progress-container">
      <IonContent className="progress-content ion-padding">
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
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ArithmeticProgress;