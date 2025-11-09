import React, { useEffect, useState } from "react";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from "@ionic/react";
import { Trophy } from "lucide-react";
import { supabase } from "../../utils/supabaseClient";

interface Profile {
  lastname: string;
}

interface Quiz {
  category: string;
  subject: string;
}

interface RawScoreRow {
  score: number;
  time_taken: number;
  profiles: Profile | Profile[];
  quizzes: Quiz | Quiz[];
}

interface LeaderboardRow {
  score: number;
  time_taken: number;
  profiles: { lastname: string };
  quizzes: { category: string; subject: string };
}

const UniformMotionLeaderboard: React.FC = () => {
  const [wordProblemData, setWordProblemData] = useState<LeaderboardRow[]>([]);
  const [problemSolvingData, setProblemSolvingData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const normalizeRow = (r: RawScoreRow): LeaderboardRow => {
    const lastname = Array.isArray(r.profiles) ? r.profiles[0]?.lastname ?? "" : r.profiles?.lastname ?? "";
    const category = Array.isArray(r.quizzes) ? r.quizzes[0]?.category ?? "" : r.quizzes?.category ?? "";
    const subject = Array.isArray(r.quizzes) ? r.quizzes[0]?.subject ?? "" : r.quizzes?.subject ?? "";

    return {
      score: Number(r.score ?? 0),
      time_taken: Number(r.time_taken ?? 0),
      profiles: { lastname },
      quizzes: { category, subject },
    };
  };

  const filterHighestPerUser = (data: LeaderboardRow[]) => {
    const map = new Map<string, LeaderboardRow>();
    data.forEach((row) => {
      const key = row.profiles.lastname;
      const existing = map.get(key);
      if (!existing) map.set(key, row);
      else if (row.score > existing.score || (row.score === existing.score && row.time_taken < existing.time_taken)) {
        map.set(key, row);
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.time_taken - b.time_taken;
    });
  };

  const fetchLeaderboards = async () => {
    setLoading(true);
    try {
      const fetchCategory = async (category: string) => {
        const { data, error } = await supabase
          .from("scores")
          .select(`score,time_taken,profiles!inner(lastname),quizzes!inner(category,subject)`)
          .eq("quizzes.subject", "Uniform Motion in Physics")
          .eq("quizzes.category", category);

        if (error) {
          console.error(`${category} Error:`, error);
          return [];
        }

        return (data as RawScoreRow[]).map(normalizeRow);
      };

      const wordProblemRaw = await fetchCategory("Word Problem");
      const problemRaw = await fetchCategory("Problem Solving");

      setWordProblemData(filterHighestPerUser(wordProblemRaw));
      setProblemSolvingData(filterHighestPerUser(problemRaw));
    } catch (e) {
      console.error("Unexpected fetch error", e);
      setWordProblemData([]);
      setProblemSolvingData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const renderTable = (data: LeaderboardRow[]) => (
    <div className="leaderboard-table-wrapper">
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Place</th>
            <th>Lastname</th>
            <th>Score</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{row.profiles.lastname || "-"}</td>
                <td>{row.score}</td>
                <td>{formatTime(row.time_taken)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4}>No data found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Uniform Motion Leaderboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="leaderboard-card">
          <h2 className="leaderboard-title">Word Problem Leaderboard</h2>
          <div className="trophy-icon">
            <Trophy size={20} color="#f59e0b" />
          </div>
          {loading ? <p>Loading...</p> : renderTable(wordProblemData)}
        </div>

        <div className="leaderboard-card">
          <h2 className="leaderboard-title">Problem Solving Leaderboard</h2>
          <div className="trophy-icon">
            <Trophy size={20} color="#3b82f6" />
          </div>
          {loading ? <p>Loading...</p> : renderTable(problemSolvingData)}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default UniformMotionLeaderboard;
