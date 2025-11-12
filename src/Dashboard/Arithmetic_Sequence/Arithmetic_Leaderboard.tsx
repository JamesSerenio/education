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
  category: "Word Problem" | "Problem Solving";
  easy: number;
  average: number;
  difficult: number;
  total_score: number;
  quizzes_taken: number;
}

const ArithmeticLeaderboard: React.FC = () => {
  const [data, setData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    "All" | "Easy" | "Average" | "Difficult"
  >("All");

  useEffect(() => {
    fetchLeaderboards();
  }, [selectedDifficulty]);

  const fetchLeaderboards = async () => {
    setLoading(true);
    try {
      const { data: fetchedData, error } = await supabase
        .from("student_scores_overview")
        .select("*");

      if (error) {
        console.error("Error fetching leaderboard:", error);
        setData([]);
        return;
      }

      if (!fetchedData) {
        setData([]);
        return;
      }

      // Cast data to our interface
      const typedData = fetchedData as unknown as LeaderboardRow[];

      // Group by user + category to calculate quizzes_taken
      const grouped: Record<string, LeaderboardRow> = {};

      typedData.forEach((row) => {
        const key = `${row.user_id}-${row.category}`;
        if (!grouped[key]) {
          grouped[key] = {
            user_id: row.user_id,
            firstname: row.firstname,
            lastname: row.lastname,
            category: row.category,
            easy: row.easy,
            average: row.average,
            difficult: row.difficult,
            total_score: row.total_score,
            quizzes_taken: 1,
          };
        } else {
          // Increment quizzes_taken but do NOT sum scores
          grouped[key].quizzes_taken += 1;
        }
      });

      let rows = Object.values(grouped);

      // Filter by difficulty
      if (selectedDifficulty !== "All") {
        rows = rows.filter((r) => {
          if (selectedDifficulty === "Easy") return r.easy > 0;
          if (selectedDifficulty === "Average") return r.average > 0;
          return r.difficult > 0;
        });
      }

      setData(rows);
    } catch (err) {
      console.error("Unexpected fetch error:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderTable = (category: "Word Problem" | "Problem Solving") => {
    const rows = data
      .filter((r) => r.category === category)
      .sort((a, b) => {
        if (selectedDifficulty === "All") return b.total_score - a.total_score;
        if (selectedDifficulty === "Easy") return b.easy - a.easy;
        if (selectedDifficulty === "Average") return b.average - a.average;
        return b.difficult - a.difficult;
      });

    const medals = ["🥇", "🥈", "🥉"];

    return (
      <div className="leaderboard-table-wrapper">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Place</th>
              <th>Lastname</th>
              {selectedDifficulty === "All" ? (
                <>
                  <th>Easy</th>
                  <th>Average</th>
                  <th>Difficult</th>
                  <th>Total</th>
                  <th>Quizzes Taken</th>
                </>
              ) : (
                <th>Score</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={`${row.user_id}-${row.category}`}>
                  <td>{medals[index] || index + 1}</td>
                  <td>{row.lastname}</td>
                  {selectedDifficulty === "All" ? (
                    <>
                      <td>{row.easy}</td>
                      <td>{row.average}</td>
                      <td>{row.difficult}</td>
                      <td>{row.total_score}</td>
                      <td>{row.quizzes_taken}</td>
                    </>
                  ) : (
                    <td>
                      {selectedDifficulty === "Easy"
                        ? row.easy
                        : selectedDifficulty === "Average"
                        ? row.average
                        : row.difficult}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={selectedDifficulty === "All" ? 7 : 3}>
                  No data found.
                </td>
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
          <h2 className="leaderboard-title">Word Problem Leaderboard</h2>
          <div className="trophy-icon">
            <Trophy size={20} color="#65a30d" />
          </div>
          {loading ? <p>Loading...</p> : renderTable("Word Problem")}
        </div>

        <div className="leaderboard-card">
          <h2 className="leaderboard-title">Problem Solving Leaderboard</h2>
          <div className="trophy-icon">
            <Trophy size={20} color="#eab308" />
          </div>
          {loading ? <p>Loading...</p> : renderTable("Problem Solving")}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ArithmeticLeaderboard;
