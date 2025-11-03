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
    let lastname = "";
    if (r.profiles) {
      lastname = Array.isArray(r.profiles) ? r.profiles[0]?.lastname ?? "" : r.profiles.lastname ?? "";
    }

    let category = "";
    let subject = "";
    if (r.quizzes) {
      if (Array.isArray(r.quizzes)) {
        category = r.quizzes[0]?.category ?? "";
        subject = r.quizzes[0]?.subject ?? "";
      } else {
        category = r.quizzes.category ?? "";
        subject = r.quizzes.subject ?? "";
      }
    }

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
      if (!existing) {
        map.set(key, row);
      } else {
        if (row.score > existing.score) map.set(key, row);
        else if (row.score === existing.score && row.time_taken < existing.time_taken) map.set(key, row);
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
    <table style={tableStyle}>
      <thead style={theadStyle}>
        <tr>
          <th style={thStyle}>Place</th>
          <th style={thStyle}>Lastname</th>
          <th style={thStyle}>Score</th>
          <th style={thStyle}>Time</th>
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((row, index) => (
            <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={tdStyle}>{index + 1}</td>
              <td style={tdStyle}>{row.profiles.lastname || "-"}</td>
              <td style={tdStyle}>{row.score}</td>
              <td style={tdStyle}>{formatTime(row.time_taken)}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td style={tdStyle} colSpan={4}>
              No data found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Uniform Motion Leaderboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={cardStyle}>
          <h2 style={blackTitle}>Word Problem Leaderboard</h2>
          <div style={iconWrapper}>
            <Trophy size={20} color="#f59e0b" />
          </div>
          {loading ? <p>Loading...</p> : renderTable(wordProblemData)}
        </div>

        <div style={{ ...cardStyle, marginTop: 20 }}>
          <h2 style={blackTitle}>Problem Solving Leaderboard</h2>
          <div style={iconWrapper}>
            <Trophy size={20} color="#3b82f6" />
          </div>
          {loading ? <p>Loading...</p> : renderTable(problemSolvingData)}
        </div>
      </IonContent>
    </IonPage>
  );
};

/* Styles a */
const cardStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: "0 auto",
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  padding: 16,
  border: "1px solid #e5e7eb",
};

const blackTitle: React.CSSProperties = {
  textAlign: "center",
  color: "#000",
  fontSize: 22,
  margin: 0,
};

const iconWrapper: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  margin: "8px 0",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 12,
};

const theadStyle: React.CSSProperties = {
  background: "#f3f4f6",
};

const thStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #e5e7eb",
  textAlign: "center",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #eee",
  textAlign: "center",
};

export default UniformMotionLeaderboard;
