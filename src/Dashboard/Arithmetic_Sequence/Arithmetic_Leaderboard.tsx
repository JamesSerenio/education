import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonContent,
  IonTitle,
  IonToolbar,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import { Trophy } from "lucide-react";
import { supabase } from "../../utils/supabaseClient";

// Define a type exactly matching your SQL view
interface StudentScoreOverview {
  user_id: string;
  firstname: string;
  lastname: string;
  easy: number;
  average: number;
  difficult: number;
  overall: number;
  quizzes_taken: number;
}

const ArithmeticLeaderboard: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<StudentScoreOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedDifficulty]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Fetch leaderboard from the view without generic type
      const { data, error } = await supabase
        .from("student_scores_overview")
        .select("*")
        .order("overall", { ascending: false });

      if (error) {
        console.error("Error fetching leaderboard:", error);
        setLeaderboardData([]);
        return;
      }

      let rows = (data || []) as StudentScoreOverview[];

      // Filter by difficulty in JS
      if (selectedDifficulty !== "All") {
        rows = rows
          .filter((r) => {
            if (selectedDifficulty === "Easy") return r.easy > 0;
            if (selectedDifficulty === "Average") return r.average > 0;
            if (selectedDifficulty === "Difficult") return r.difficult > 0;
            return true;
          })
          .sort((a, b) => {
            if (selectedDifficulty === "Easy") return b.easy - a.easy;
            if (selectedDifficulty === "Average") return b.average - a.average;
            if (selectedDifficulty === "Difficult") return b.difficult - a.difficult;
            return 0;
          });
      }

      setLeaderboardData(rows);
    } catch (e) {
      console.error("Unexpected fetch error:", e);
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderTable = (data: StudentScoreOverview[]) => {
    const medals = ["🥇", "🥈", "🥉"];
    return (
      <div className="leaderboard-table-wrapper">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Place</th>
              <th>Lastname</th>
              <th>Easy</th>
              <th>Average</th>
              <th>Difficult</th>
              <th>Overall</th>
              <th>Quizzes Taken</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <tr key={row.user_id}>
                  <td>{medals[index] || index + 1}</td>
                  <td>{row.lastname}</td>
                  <td>{row.easy}</td>
                  <td>{row.average}</td>
                  <td>{row.difficult}</td>
                  <td>{row.overall}</td>
                  <td>{row.quizzes_taken}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7}>No data found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Arithmetic Sequence Leaderboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding arithmetic-module-container">
        <div style={{ marginBottom: "1rem" }}>
          <label>Filter by Difficulty:</label>
          <IonSelect
            value={selectedDifficulty}
            onIonChange={(e) => setSelectedDifficulty(e.detail.value)}
          >
            <IonSelectOption value="All">All</IonSelectOption>
            <IonSelectOption value="Easy">Easy</IonSelectOption>
            <IonSelectOption value="Average">Average</IonSelectOption>
            <IonSelectOption value="Difficult">Difficult</IonSelectOption>
          </IonSelect>
        </div>

        <div className="leaderboard-card">
          <h2 className="leaderboard-title">Leaderboard</h2>
          <div className="trophy-icon">
            <Trophy size={20} color="#65a30d" />
          </div>
          {loading ? <p>Loading...</p> : renderTable(leaderboardData)}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ArithmeticLeaderboard;
