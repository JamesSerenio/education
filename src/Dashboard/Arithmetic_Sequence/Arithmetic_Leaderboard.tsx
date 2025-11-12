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
  easy_total: number;
  average_total: number;
  difficult_total: number;
  overall_total: number;
  quizzes_taken: number;
}

const ArithmeticLeaderboard: React.FC = () => {
  const [wordProblemData, setWordProblemData] = useState<LeaderboardRow[]>([]);
  const [problemSolvingData, setProblemSolvingData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");

  useEffect(() => {
    fetchLeaderboards();
  }, [selectedDifficulty]);

  const fetchLeaderboards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("student_scores_overview")
        .select("*")
        .order("overall_total", { ascending: false });

      if (error) {
        console.error("Error fetching leaderboard:", error);
        setWordProblemData([]);
        setProblemSolvingData([]);
        return;
      }

      let rows = data as LeaderboardRow[];

      // Only include users who have taken at least one quiz
      rows = rows.filter((r) => r.overall_total > 0);

      // Filter by difficulty if selected
      const filterByDifficulty = (row: LeaderboardRow) => {
        if (selectedDifficulty === "All") return true;
        if (selectedDifficulty === "Easy") return row.easy_total > 0;
        if (selectedDifficulty === "Average") return row.average_total > 0;
        return row.difficult_total > 0;
      };

      const sortByDifficulty = (a: LeaderboardRow, b: LeaderboardRow) => {
        if (selectedDifficulty === "All") return b.overall_total - a.overall_total;
        if (selectedDifficulty === "Easy") return b.easy_total - a.easy_total;
        if (selectedDifficulty === "Average") return b.average_total - a.average_total;
        return b.difficult_total - a.difficult_total;
      };

      const wordProblemRows = rows
        .filter((r) => r.category === "Word Problem" && filterByDifficulty(r))
        .sort(sortByDifficulty);

      const problemSolvingRows = rows
        .filter((r) => r.category === "Problem Solving" && filterByDifficulty(r))
        .sort(sortByDifficulty);

      setWordProblemData(wordProblemRows);
      setProblemSolvingData(problemSolvingRows);
    } catch (err) {
      console.error("Unexpected fetch error:", err);
      setWordProblemData([]);
      setProblemSolvingData([]);
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
              {selectedDifficulty === "All" && (
                <>
                  <th>Easy</th>
                  <th>Average</th>
                  <th>Difficult</th>
                  <th>Overall</th>
                  <th>Quizzes Taken</th>
                </>
              )}
              {selectedDifficulty !== "All" && <th>Score</th>}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <tr key={row.user_id}>
                  <td>{medals[index] || index + 1}</td>
                  <td>{row.lastname}</td>
                  {selectedDifficulty === "All" && (
                    <>
                      <td>{row.easy_total}</td>
                      <td>{row.average_total}</td>
                      <td>{row.difficult_total}</td>
                      <td>{row.overall_total}</td>
                      <td>{row.quizzes_taken}</td>
                    </>
                  )}
                  {selectedDifficulty !== "All" && (
                    <td>
                      {selectedDifficulty === "Easy"
                        ? row.easy_total
                        : selectedDifficulty === "Average"
                        ? row.average_total
                        : row.difficult_total}
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
          {loading ? <p>Loading...</p> : renderTable(wordProblemData)}
        </div>

        <div className="leaderboard-card">
          <h2 className="leaderboard-title">Problem Solving Leaderboard</h2>
          <div className="trophy-icon">
            <Trophy size={20} color="#eab308" />
          </div>
          {loading ? <p>Loading...</p> : renderTable(problemSolvingData)}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ArithmeticLeaderboard;
