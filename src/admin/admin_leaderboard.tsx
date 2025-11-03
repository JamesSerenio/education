// src/pages/AdminLeaderboard.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from "@ionic/react";
import { Trophy } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

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

const AdminLeaderboard: React.FC = () => {
  // Arithmetic
  const [arithWordData, setArithWordData] = useState<LeaderboardRow[]>([]);
  const [arithProblemData, setArithProblemData] = useState<LeaderboardRow[]>([]);

  // Motion
  const [motionWordData, setMotionWordData] = useState<LeaderboardRow[]>([]);
  const [motionProblemData, setMotionProblemData] = useState<LeaderboardRow[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const normalizeRow = (r: RawScoreRow): LeaderboardRow => {
    const lastname = Array.isArray(r.profiles)
      ? r.profiles[0]?.lastname ?? ""
      : r.profiles?.lastname ?? "";

    const category = Array.isArray(r.quizzes)
      ? r.quizzes[0]?.category ?? ""
      : r.quizzes?.category ?? "";

    const subject = Array.isArray(r.quizzes)
      ? r.quizzes[0]?.subject ?? ""
      : r.quizzes?.subject ?? "";

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
      } else if (
        row.score > existing.score ||
        (row.score === existing.score && row.time_taken < existing.time_taken)
      ) {
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
      const fetchCategory = async (subject: string, category: string) => {
        const { data, error } = await supabase
          .from("scores")
          .select(
            `score,time_taken,profiles!inner(lastname),quizzes!inner(category,subject)`
          )
          .eq("quizzes.subject", subject)
          .eq("quizzes.category", category);

        if (error) {
          console.error(`${subject} - ${category} error:`, error);
          return [];
        }
        return (data as RawScoreRow[]).map(normalizeRow);
      };

      // 🧮 Arithmetic
      const arithWordRaw = await fetchCategory(
        "Arithmetic Sequence",
        "Word Problem"
      );
      const arithProblemRaw = await fetchCategory(
        "Arithmetic Sequence",
        "Problem Solving"
      );

      setArithWordData(filterHighestPerUser(arithWordRaw));
      setArithProblemData(filterHighestPerUser(arithProblemRaw));

      // ⚙️ Uniform Motion
      const motionWordRaw = await fetchCategory(
        "Uniform Motion in Physics",
        "Word Problem"
      );
      const motionProblemRaw = await fetchCategory(
        "Uniform Motion in Physics",
        "Problem Solving"
      );

      setMotionWordData(filterHighestPerUser(motionWordRaw));
      setMotionProblemData(filterHighestPerUser(motionProblemRaw));
    } catch (e) {
      console.error("Unexpected fetch error", e);
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
          data.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={tdStyle}>{i + 1}</td>
              <td style={tdStyle}>{row.profiles.lastname || "-"}</td>
              <td style={tdStyle}>{Math.round(row.score)}</td>
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
          <IonTitle>Admin Leaderboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* 🧮 Arithmetic Leaderboard */}
        <h1 style={mainTitle}>Arithmetic Sequence Leaderboard</h1>

        <div style={cardStyle}>
          <h2 style={blackTitle}>Word Problem</h2>
          <div style={iconWrapper}>
            <Trophy size={20} color="#f59e0b" />
          </div>
          {loading ? <p>Loading...</p> : renderTable(arithWordData)}
        </div>

        <div style={{ ...cardStyle, marginTop: 18 }}>
          <h2 style={blackTitle}>Problem Solving</h2>
          <div style={iconWrapper}>
            <Trophy size={20} color="#3b82f6" />
          </div>
          {loading ? <p>Loading...</p> : renderTable(arithProblemData)}
        </div>

        {/* ⚙️ Uniform Motion Leaderboard */}
        <h1 style={{ ...mainTitle, marginTop: 40 }}>
          Uniform Motion in Physics Leaderboard
        </h1>

        <div style={cardStyle}>
          <h2 style={blackTitle}>Word Problem</h2>
          <div style={iconWrapper}>
            <Trophy size={20} color="#f59e0b" />
          </div>
          {loading ? <p>Loading...</p> : renderTable(motionWordData)}
        </div>

        <div style={{ ...cardStyle, marginTop: 18 }}>
          <h2 style={blackTitle}>Problem Solving</h2>
          <div style={iconWrapper}>
            <Trophy size={20} color="#3b82f6" />
          </div>
          {loading ? <p>Loading...</p> : renderTable(motionProblemData)}
        </div>
      </IonContent>
    </IonPage>
  );
};

/* 🎨 Styles */
const mainTitle: React.CSSProperties = {
  textAlign: "center",
  fontSize: 24,
  fontWeight: 700,
  margin: "20px 0 10px 0",
};

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
  fontSize: 20,
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

export default AdminLeaderboard;
