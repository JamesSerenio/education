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

interface Profile { lastname: string; }
interface Quiz { category: string; subject: string; difficulty: string }
interface RawScoreRow { score: number; time_taken: number; profiles: Profile | Profile[]; quizzes: Quiz | Quiz[]; }
interface LeaderboardRow { score: number; time_taken: number; profiles: { lastname: string }; quizzes: { category: string; subject: string; difficulty: string } }

const ArithmeticLeaderboard: React.FC = () => {
  const [wordProblemData, setWordProblemData] = useState<LeaderboardRow[]>([]);
  const [problemSolvingData, setProblemSolvingData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");

  useEffect(() => {
    fetchLeaderboards();
  }, [selectedDifficulty]);

  // Convert raw Supabase row into a consistent format
  const normalizeRow = (r: RawScoreRow): LeaderboardRow => {
    const lastname = Array.isArray(r.profiles) ? r.profiles[0]?.lastname ?? "" : r.profiles?.lastname ?? "";
    const quiz = Array.isArray(r.quizzes) ? r.quizzes[0] : r.quizzes;
    const category = quiz?.category ?? "";
    const subject = quiz?.subject ?? "";
    const difficulty = quiz?.difficulty ?? "";
    return { score: Number(r.score ?? 0), time_taken: Number(r.time_taken ?? 0), profiles: { lastname }, quizzes: { category, subject, difficulty } };
  };

  // Keep only the highest score per user
  const filterHighestPerUser = (data: LeaderboardRow[]) => {
    const map = new Map<string, LeaderboardRow>();
    data.forEach((row) => {
      const key = row.profiles.lastname;
      const existing = map.get(key);
      if (!existing || row.score > existing.score || (row.score === existing.score && row.time_taken < existing.time_taken)) {
        map.set(key, row);
      }
    });
    return Array.from(map.values()).sort((a, b) => b.score - a.score || a.time_taken - b.time_taken);
  };

  // Fetch only Arithmetic Sequence scores (Word Problem & Problem Solving)
  const fetchLeaderboards = async () => {
    setLoading(true);
    try {
      const fetchCategory = async (category: string) => {
        let query = supabase
          .from("scores")
          .select("score,time_taken,profiles!inner(lastname),quizzes!inner(category,subject,difficulty)")
          .eq("quizzes.subject", "Arithmetic Sequence")
          .eq("quizzes.category", category);

        if (selectedDifficulty !== "All") {
          query = query.eq("quizzes.difficulty", selectedDifficulty);
        }

        const { data, error } = await query;

        if (error) {
          console.error(`Error fetching ${category}:`, error);
          return [];
        }
        return (data as RawScoreRow[]).map(normalizeRow);
      };

      const wordProblemRaw = await fetchCategory("Word Problem");
      const problemSolvingRaw = await fetchCategory("Problem Solving");

      setWordProblemData(filterHighestPerUser(wordProblemRaw));
      setProblemSolvingData(filterHighestPerUser(problemSolvingRaw));
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
              <th>Time</th>
              <th>Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? data.map((row, index) => (
              <tr key={index}>
                <td>{medals[index] || index + 1}</td>
                <td>{row.profiles.lastname || "-"}</td>
                <td>{Math.round(row.score)}</td>
                <td>{formatTime(row.time_taken)}</td>
                <td>{row.quizzes.difficulty}</td>
              </tr>
            )) : (
              <tr><td colSpan={5}>No data found.</td></tr>
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
          <div className="trophy-icon"><Trophy size={20} color="#65a30d" /></div>
          {loading ? <p>Loading...</p> : renderTable(wordProblemData)}
        </div>

        <div className="leaderboard-card">
          <h2 className="leaderboard-title">Problem Solving Leaderboard</h2>
          <div className="trophy-icon"><Trophy size={20} color="#eab308" /></div>
          {loading ? <p>Loading...</p> : renderTable(problemSolvingData)}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ArithmeticLeaderboard;
