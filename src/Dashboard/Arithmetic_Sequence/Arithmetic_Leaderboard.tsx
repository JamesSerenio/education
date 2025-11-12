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

interface LeaderboardRow {
  user_id: string;
  firstname: string;
  lastname: string;
  easy_total: number;
  average_total: number;
  difficult_total: number;
  overall_total: number;
  quizzes_taken: number;
}

const ArithmeticLeaderboard: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedDifficulty]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("student_scores_overview")
        .select("*")
        .order("overall_total", { ascending: false });

      if (error) {
        console.error("Error fetching leaderboard:", error);
        setLeaderboardData([]);
        return;
      }

      let rows = data as LeaderboardRow[];

      // Filter by difficulty if selected
      if (selectedDifficulty !== "All") {
        const col =
          selectedDifficulty === "Easy"
            ? "easy_total"
            : selectedDifficulty === "Average"
            ? "average_total"
            : "difficult_total";
        rows = rows
          .filter((r) => r[col] > 0)
          .sort((a, b) => b[col] - a[col]); // Sort descending by that difficulty
      }

      setLeaderboardData(rows);
    } catch (err) {
      console.error("Unexpected fetch error:", err);
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderTable = (data: LeaderboardRow[]) => {
    const medals = ["🥇", "🥈", "🥉"];

    return (
      <div className="leaderboard-table-wrapper">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Place</th>
              <th>Lastname</th>
              <th>Score</th>
              {selectedDifficulty !== "All" && <th>Time</th>}
              {selectedDifficulty === "All" && (
                <>
                  <th>Easy</th>
                  <th>Average</th>
                  <th>Difficult</th>
                  <th>Overall</th>
                  <th>Quizzes Taken</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <tr key={row.user_id}>
                  <td>{medals[index] || index + 1}</td>
                  <td>{row.lastname}</td>
                  {selectedDifficulty === "Easy" && <td>{row.easy_total}</td>}
                  {selectedDifficulty === "Average" && <td>{row.average_total}</td>}
                  {selectedDifficulty === "Difficult" && <td>{row.difficult_total}</td>}
                  {selectedDifficulty === "All" && (
                    <>
                      <td>{row.easy_total}</td>
                      <td>{row.average_total}</td>
                      <td>{row.difficult_total}</td>
                      <td>{row.overall_total}</td>
                      <td>{row.quizzes_taken}</td>
                    </>
                  )}
                  {selectedDifficulty !== "All" && <td>-</td> /* Placeholder for time */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={selectedDifficulty === "All" ? 8 : 4}>No data found.</td>
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
