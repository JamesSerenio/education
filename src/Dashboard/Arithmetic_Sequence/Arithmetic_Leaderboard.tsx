import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonContent,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { Trophy } from "lucide-react";
import { supabase } from "../../utils/supabaseClient";
import "./leaderboard.css"; // <-- import the CSS (adjust path if needed)

interface Profile { lastname: string; }
interface Quiz { category: string; subject: string; }
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

const ArithmeticLeaderboard: React.FC = () => {
  const [wordProblemData, setWordProblemData] = useState<LeaderboardRow[]>([]);
  const [problemSolvingData, setProblemSolvingData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLeaderboards(); }, []);

  const normalizeRow = (r: RawScoreRow): LeaderboardRow => {
    let lastname = "";
    if (r?.profiles) {
      lastname = Array.isArray(r.profiles) ? r.profiles[0]?.lastname ?? "" : r.profiles.lastname ?? "";
    }
    let category = ""; let subject = "";
    if (r?.quizzes) {
      if (Array.isArray(r.quizzes)) { category = r.quizzes[0]?.category ?? ""; subject = r.quizzes[0]?.subject ?? ""; }
      else { category = r.quizzes.category ?? ""; subject = r.quizzes.subject ?? ""; }
    }
    return { score: Number(r?.score ?? 0), time_taken: Number(r?.time_taken ?? 0), profiles: { lastname }, quizzes: { category, subject } };
  };

  const filterHighestPerUser = (data: LeaderboardRow[]) => {
    const map = new Map<string, LeaderboardRow>();
    data.forEach((row) => {
      const key = row.profiles.lastname;
      const existing = map.get(key);
      if (!existing) map.set(key, row);
      else {
        if (row.score > existing.score) map.set(key, row);
        else if (row.score === existing.score && row.time_taken < existing.time_taken) map.set(key, row);
      }
    });
    return Array.from(map.values()).sort((a,b) => (b.score !== a.score ? b.score - a.score : a.time_taken - b.time_taken));
  };

  const fetchLeaderboards = async () => {
    setLoading(true);
    try {
      const fetchCategory = async (category: string) => {
        const { data, error } = await supabase
          .from("scores")
          .select(`score, time_taken, profiles!inner(lastname), quizzes!inner(category, subject)`)
          .eq("quizzes.subject", "Arithmetic Sequence")
          .eq("quizzes.category", category);
        if (error) { console.error(`${category} Error:`, error); return []; }
        return (data as RawScoreRow[]).map(normalizeRow);
      };
      const wordProblemRaw = await fetchCategory("Word Problem");
      const problemRaw = await fetchCategory("Problem Solving");
      setWordProblemData(filterHighestPerUser(wordProblemRaw));
      setProblemSolvingData(filterHighestPerUser(problemRaw));
    } catch (e) {
      console.error("Unexpected fetch error", e);
      setWordProblemData([]); setProblemSolvingData([]);
    } finally { setLoading(false); }
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60); const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const renderTable = (data: LeaderboardRow[]) => (
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
        {data.length > 0 ? data.map((row, index) => {
          const topClass = index === 0 ? "leaderboard-row-top1" : index === 1 ? "leaderboard-row-top2" : index === 2 ? "leaderboard-row-top3" : "";
          return (
            <tr key={index} className={topClass}>
              <td><span className="place-badge">{index + 1}</span></td>
              <td>{row.profiles?.lastname || "-"}</td>
              <td>{Math.round(row.score)}</td>
              <td>{formatTime(row.time_taken)}</td>
            </tr>
          );
        }) : (
          <tr><td colSpan={4}>No data found.</td></tr>
        )}
      </tbody>
    </table>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Arithmetic Sequence Leaderboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="leaderboard-page">
        <div className="leaderboard-card">
          <h3 className="leaderboard-title">Word Problem Leaderboard</h3>
          <div className="trophy-wrap"><Trophy size={20} color="#f59e0b" /></div>
          {loading ? <p style={{textAlign:"center", color:"#6b7280"}}>Loading…</p> : renderTable(wordProblemData)}
        </div>

        <div className="leaderboard-card">
          <h3 className="leaderboard-title">Problem Solving Leaderboard</h3>
          <div className="trophy-wrap"><Trophy size={20} color="#3b82f6" /></div>
          {loading ? <p style={{textAlign:"center", color:"#6b7280"}}>Loading…</p> : renderTable(problemSolvingData)}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ArithmeticLeaderboard;
