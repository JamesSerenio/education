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
import ReactApexChart from "react-apexcharts";
import { supabase } from "../../utils/supabaseClient";

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
  subject: string;
}

interface ProgressRow {
  user_id: string;
  lastname: string;
  category: "Word Problem" | "Problem Solving";
  quizzes_taken: number;
  scores: number[];
}

const MAX_SCORE = 15;

const ArithmeticProgressLine: React.FC = () => {
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
        .select("*")
        .eq("subject", "Arithmetic Sequence");

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

  const getChartSeries = () => {
    const filtered = data.filter((d) => d.category === selectedCategory);
    return filtered.map((user) => ({
      name: user.lastname,
      data: user.scores,
    }));
  };

  const getChartCategories = () => {
    const filtered = data.filter((d) => d.category === selectedCategory);
    const maxQuizzes = filtered.reduce((max, user) => Math.max(max, user.quizzes_taken), 0);
    return Array.from({ length: maxQuizzes }, (_, i) => `Quiz ${i + 1}`);
  };

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "line",
      height: 350,
      zoom: { enabled: false },
    },
    stroke: { curve: "straight" },
    title: {
      text: `Arithmetic Sequence Progress - ${selectedCategory}`,
      align: "left",
    },
    xaxis: { categories: getChartCategories() },
    yaxis: { max: MAX_SCORE, min: 0 },
    dataLabels: { enabled: false },
    grid: {
      row: { colors: ["#f3f3f3", "transparent"], opacity: 0.5 },
    },
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Arithmetic Sequence Progress</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="progress-page">
        <div className="progress-filter">
          <label>Select Category:</label>
          <IonSelect
            value={selectedCategory}
            onIonChange={(e) => setSelectedCategory(e.detail.value)}
            className="progress-select"
          >
            <IonSelectOption value="Word Problem">Word Problem</IonSelectOption>
            <IonSelectOption value="Problem Solving">Problem Solving</IonSelectOption>
          </IonSelect>
        </div>

        {loading ? (
          <div className="progress-loading">Loading...</div>
        ) : (
          <div className="progress-chart-card">
            <ReactApexChart
              options={chartOptions}
              series={getChartSeries()}
              type="line"
              height={350}
            />
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ArithmeticProgressLine;
