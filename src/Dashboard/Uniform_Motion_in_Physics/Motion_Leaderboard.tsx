import React, { useEffect, useState } from "react";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from "@ionic/react";
import { Trophy } from "lucide-react";
import { supabase } from "../../utils/supabaseClient";

interface LeaderboardRow {
  score: number;
  time_taken: number;
  profiles: { lastname: string };
  quizzes: { category: string };
}

const MotionLeaderboard: React.FC = () => {
  const [solvingData, setSolvingData] = useState<LeaderboardRow[]>([]);
  const [problemSolvingData, setProblemSolvingData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Normalize a raw Supabase row into our LeaderboardRow
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizeRow = (r: any): LeaderboardRow => {
    let lastname = "";
    if (r?.profiles) {
      if (Array.isArray(r.profiles)) lastname = r.profiles[0]?.lastname ?? "";
      else lastname = r.profiles.lastname ?? "";
    }

    let category = "";
    if (r?.quizzes) {
      if (Array.isArray(r.quizzes)) category = r.quizzes[0]?.category ?? "";
      else category = r.quizzes.category ?? "";
    }

    return {
      score: Number(r?.score ?? 0),
      time_taken: Number(r?.time_taken ?? 0),
      profiles: { lastname },
      quizzes: { category },
    };
  };

  const fetchLeaderboards = async () => {
    setLoading(true);
    try {
      // Solving
      const { data: solvingRaw, error: err1 } = await supabase
        .from("scores")
        .select(`score,time_taken,profiles!inner(lastname),quizzes!inner(category,subject)`)
        .eq("quizzes.category", "Solving")
        .eq("quizzes.subject", "Uniform Motion in Physics")
        .order("score", { ascending: false })
        .order("time_taken", { ascending: true });

      if (err1) console.error("Solving Error:", err1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      else setSolvingData((solvingRaw ?? []).map((r: any) => normalizeRow(r)));

      // Problem Solving
      const { data: problemRaw, error: err2 } = await supabase
        .from("scores")
        .select(`score,time_taken,profiles!inner(lastname),quizzes!inner(category,subject)`)
        .eq("quizzes.category", "Problem Solving")
        .eq("quizzes.subject", "Uniform Motion in Physics")
        .order("score", { ascending: false })
        .order("time_taken", { ascending: true });

      if (err2) console.error("Problem Solving Error:", err2);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      else setProblemSolvingData((problemRaw ?? []).map((r: any) => normalizeRow(r)));
    } catch (e) {
      console.error("Unexpected fetch error", e);
      setSolvingData([]);
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
          <h2 style={blackTitle}>Solving Leaderboard</h2>
          <div style={iconWrapper}>
            <Trophy size={24} color="#f59e0b" />
          </div>
          {loading ? <p>Loading...</p> : renderTable(solvingData)}
        </div>

        <div style={{ ...cardStyle, marginTop: 20 }}>
          <h2 style={blackTitle}>Problem Solving Leaderboard</h2>
          <div style={iconWrapper}>
            <Trophy size={24} color="#3b82f6" />
          </div>
          {loading ? <p>Loading...</p> : renderTable(problemSolvingData)}
        </div>
      </IonContent>
    </IonPage>
  );
};

/* Styles */
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
  color: "#000", // black text
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

export default MotionLeaderboard;
