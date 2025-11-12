import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import { supabase } from "../../utils/supabaseClient";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ScoreRow {
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

interface ProgressRow {
  user_id: string;
  lastname: string;
  category: "Word Problem" | "Problem Solving";
  quizzes_taken: number;
  scores: number[];
}

const MAX_SCORE = 15;

const ArithmeticProgress: React.FC = () => {
  const [data, setData] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<"Word Problem" | "Problem Solving">(
    "Word Problem"
  );

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    setLoading(true);
    try {
      const { data: fetchedData, error } = await supabase
        .from("student_scores_overview")
        .select("*");

      if (error) throw error;

      const mappedData: ProgressRow[] = (fetchedData as ScoreRow[]).map((row) => ({
        user_id: row.user_id,
        lastname: row.lastname,
        category: row.category,
        quizzes_taken: row.quizzes_taken,
        scores: [row.easy_total, row.average_total, row.difficult_total].slice(
          0,
          row.quizzes_taken
        ),
      }));

      setData(mappedData);
    } catch (err) {
      console.error("Error fetching progress:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const chartData = () => {
    const filtered = data.filter((d) => d.category === selectedCategory);

    const maxQuizzes = filtered.reduce((max, user) => Math.max(max, user.quizzes_taken), 0);

    return {
      labels: Array.from({ length: maxQuizzes }, (_, i) => `Quiz ${i + 1}`),
      datasets: filtered.map((user, idx) => ({
        label: user.lastname,
        data: user.scores,
        backgroundColor: `rgba(${(idx * 50) % 255}, ${(idx * 80) % 255}, ${(idx * 120) % 255}, 0.6)`,
      })),
    };
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: `Progress - ${selectedCategory}` },
    },
    scales: {
      y: { beginAtZero: true, max: MAX_SCORE },
    },
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

          <div className="progress-category">
            <label className="progress-label">Select Category:</label>
            <IonSelect
              className="progress-select"
              value={selectedCategory}
              onIonChange={(e) => setSelectedCategory(e.detail.value)}
            >
              <IonSelectOption value="Word Problem">Word Problem</IonSelectOption>
              <IonSelectOption value="Problem Solving">Problem Solving</IonSelectOption>
            </IonSelect>
          </div>

          {loading ? (
            <p className="progress-loading">Loading...</p>
          ) : (
            <div className="progress-chart">
              <Bar data={chartData()} options={options} />
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ArithmeticProgress;
