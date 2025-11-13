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

// Type for Supabase fetch including relations
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

const ArithmeticLeaderboard: React.FC = () => {
  const [data, setData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");

  useEffect(() => {
    fetchLeaderboards();
  }, [selectedDifficulty]);

  const fetchLeaderboards = async () => {
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
        .in("quizzes.category", ["Word Problem", "Problem Solving"]);

      if (error) {
        console.error("Error fetching leaderboard:", error);
        setData([]);
        return;
      }

      // Safely map fetched data
      const rows: LeaderboardRow[] = (fetchedData ?? []).map((row: ScoreWithRelations) => ({
        user_id: row.user_id,
        firstname: row.profiles.firstname,
        lastname: row.profiles.lastname,
        category: row.quizzes.category,
        easy_total: row.easy,
        average_total: row.average,
        difficult_total: row.difficult,
        overall_total: row.total_score || (row.easy + row.average + row.difficult), // Fallback to sum if total_score is null
        quizzes_taken: 1,
      }));

      // Aggregate to sum scores and count quizzes per user per category
      const aggregated = new Map<string, LeaderboardRow>();
      rows.forEach((row) => {
        const key = `${row.user_id}-${row.category}`;
        const existing = aggregated.get(key);
        if (existing) {
          existing.easy_total += row.easy_total;
          existing.average_total += row.average_total;
          existing.difficult_total += row.difficult_total;
          existing.overall_total += row.overall_total;
          existing.quizzes_taken += 1;
        } else {
          aggregated.set(key, { ...row });
        }
      });
      const aggregatedRows = Array.from(aggregated.values());

      // Filter by difficulty (remove strict >0 filter to show all data)
      let filteredRows = aggregatedRows;
      if (selectedDifficulty !== "All") {
        filteredRows = filteredRows.filter(r => {
          if (selectedDifficulty === "Easy") return r.easy_total > 0;
          if (selectedDifficulty === "Average") return r.average_total > 0;
          return r.difficult_total > 0;
        });
      }

      setData(filteredRows);
    } catch (err) {
      console.error("Unexpected fetch error:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderTable = (category: "Word Problem" | "Problem Solving") => {
    const rows = data
      .filter(r => r.category === category)
      .sort((a, b) => {
        if (selectedDifficulty === "All") return b.overall_total - a.overall_total;
        if (selectedDifficulty === "Easy") return b.easy_total - a.easy_total;
        if (selectedDifficulty === "Average") return b.average_total - a.average_total;
        return b.difficult_total - a.difficult_total;
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
                  <th>Overall</th>
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
                      <td>{row.easy_total}</td>
                      <td>{row.average_total}</td>
                      <td>{row.difficult_total}</td>
                      <td>{row.overall_total}</td>
                      <td>{row.quizzes_taken}</td>
                    </>
                  ) : (
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
