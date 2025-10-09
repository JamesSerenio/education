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

const ArithmeticLeaderboard: React.FC = () => {
  const [solvingData, setSolvingData] = useState<LeaderboardRow[]>([]);
  const [problemSolvingData, setProblemSolvingData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const normalizeRow = (r: RawScoreRow): LeaderboardRow => {
    let lastname = "";
    if (r?.profiles) {
      lastname = Array.isArray(r.profiles)
        ? r.profiles[0]?.lastname ?? ""
        : r.profiles.lastname ?? "";
    }

    let category = "";
    let subject = "";
    if (r?.quizzes) {
      if (Array.isArray(r.quizzes)) {
        category = r.quizzes[0]?.category ?? "";
        subject = r.quizzes[0]?.subject ?? "";
      } else {
        category = r.quizzes.category ?? "";
        subject = r.quizzes.subject ?? "";
      }
    }

    return {
      score: Number(r?.score ?? 0),
      time_taken: Number(r?.time_taken ?? 0),
      profiles: { lastname },
      quizzes: { category, subject },
    };
  };

  const fetchLeaderboards = async () => {
    setLoading(true);

    try {
      // ✅ Solving - Arithmetic Sequence only
      const { data: solvingRaw, error: err1 } = await supabase
        .from("scores")
        .select(
          `
          score,
          time_taken,
          profiles!inner(lastname),
          quizzes!inner(category, subject)
        `
        )
        .eq("quizzes.subject", "Arithmetic Sequence")
        .eq("quizzes.category", "Solving")
        .order("score", { ascending: false })
        .order("time_taken", { ascending: true });

      if (err1) {
        console.error("Solving Error:", err1);
        setSolvingData([]);
      } else if (solvingRaw) {
        const mapped = (solvingRaw as RawScoreRow[]).map(normalizeRow);
        setSolvingData(mapped);
      }

      // ✅ Problem Solving - Arithmetic Sequence only
      const { data: problemRaw, error: err2 } = await supabase
        .from("scores")
        .select(
          `
          score,
          time_taken,
          profiles!inner(lastname),
          quizzes!inner(category, subject)
        `
        )
        .eq("quizzes.subject", "Arithmetic Sequence")
        .eq("quizzes.category", "Problem Solving")
        .order("score", { ascending: false })
        .order("time_taken", { ascending: true });

      if (err2) {
        console.error("Problem Solving Error:", err2);
        setProblemSolvingData([]);
      } else if (problemRaw) {
        const mapped = (problemRaw as RawScoreRow[]).map(normalizeRow);
        setProblemSolvingData(mapped);
      }
    } catch (e) {
      console.error("Unexpected fetch error", e);
      setSolvingData([]);
      setProblemSolvingData([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper: format seconds to mm:ss
  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const renderTable = (data: LeaderboardRow[]) => (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
      <thead style={{ background: "#f3f4f6" }}>
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
              <td style={tdStyle}>{row.profiles?.lastname || "-"}</td>
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
          <IonTitle>Arithmetic Sequence Leaderboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={cardStyle}>
          <h2 style={{ margin: 0, textAlign: "center" }}>Solving Leaderboard</h2>
          <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
            <Trophy size={20} color="#f59e0b" />
          </div>
          {loading ? <p>Loading...</p> : renderTable(solvingData)}
        </div>

        <div style={{ ...cardStyle, marginTop: 18 }}>
          <h2 style={{ margin: 0, textAlign: "center" }}>Problem Solving Leaderboard</h2>
          <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
            <Trophy size={20} color="#3b82f6" />
          </div>
          {loading ? <p>Loading...</p> : renderTable(problemSolvingData)}
        </div>
      </IonContent>
    </IonPage>
  );
};

/* Inline styles */
const cardStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: "0 auto",
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  padding: 16,
  border: "1px solid #e5e7eb",
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

export default ArithmeticLeaderboard;
