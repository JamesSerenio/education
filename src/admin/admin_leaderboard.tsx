// admin_leaderboard.tsx
import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonContent,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { Trophy } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

interface Profile {
  lastname: string;
}

interface Quiz {
  category: string;
  subject?: string;
}

interface LeaderboardRow {
  score: number;
  time_taken: number;
  profiles: Profile;
  quizzes: Quiz;
}

const AdminLeaderboard: React.FC = () => {
  const [solvingData, setSolvingData] = useState<LeaderboardRow[]>([]);
  const [problemSolvingData, setProblemSolvingData] = useState<LeaderboardRow[]>([]);
  const [motionSolvingData, setMotionSolvingData] = useState<LeaderboardRow[]>([]);
  const [motionProblemData, setMotionProblemData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const normalizeRow = (r: Record<string, unknown>): LeaderboardRow => {
    const profile = r.profiles as Profile | Profile[] | null;
    const quiz = r.quizzes as Quiz | Quiz[] | null;

    const lastname =
      Array.isArray(profile) ? profile[0]?.lastname ?? "" : profile?.lastname ?? "";

    const category =
      Array.isArray(quiz) ? quiz[0]?.category ?? "" : quiz?.category ?? "";

    const subject =
      Array.isArray(quiz) ? quiz[0]?.subject ?? undefined : quiz?.subject ?? undefined;

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
      // ✅ Arithmetic - Solving (IGNORE Motion)
      const { data: solvingRaw, error: err1 } = await supabase
        .from("scores")
        .select(
          `score,time_taken,profiles!inner(lastname),quizzes!inner(category,subject)`
        )
        .eq("quizzes.category", "Solving")
        .eq("quizzes.subject", "Arithmetic Sequence") // ✅ only arithmetic
        .order("score", { ascending: false })
        .order("time_taken", { ascending: true });

      if (!err1 && solvingRaw)
        setSolvingData(solvingRaw.map((r) => normalizeRow(r)));

      // ✅ Arithmetic - Problem Solving (IGNORE Motion)
      const { data: problemRaw, error: err2 } = await supabase
        .from("scores")
        .select(
          `score,time_taken,profiles!inner(lastname),quizzes!inner(category,subject)`
        )
        .eq("quizzes.category", "Problem Solving")
        .eq("quizzes.subject", "Arithmetic Sequence") // ✅ only arithmetic
        .order("score", { ascending: false })
        .order("time_taken", { ascending: true });

      if (!err2 && problemRaw)
        setProblemSolvingData(problemRaw.map((r) => normalizeRow(r)));

      // ✅ Motion - Solving (IGNORE Arithmetic)
      const { data: motionSolvingRaw, error: err3 } = await supabase
        .from("scores")
        .select(
          `score,time_taken,profiles!inner(lastname),quizzes!inner(category,subject)`
        )
        .eq("quizzes.category", "Solving")
        .eq("quizzes.subject", "Uniform Motion in Physics") // ✅ only motion
        .order("score", { ascending: false })
        .order("time_taken", { ascending: true });

      if (!err3 && motionSolvingRaw)
        setMotionSolvingData(motionSolvingRaw.map((r) => normalizeRow(r)));

      // ✅ Motion - Problem Solving (IGNORE Arithmetic)
      const { data: motionProblemRaw, error: err4 } = await supabase
        .from("scores")
        .select(
          `score,time_taken,profiles!inner(lastname),quizzes!inner(category,subject)`
        )
        .eq("quizzes.category", "Problem Solving")
        .eq("quizzes.subject", "Uniform Motion in Physics") // ✅ only motion
        .order("score", { ascending: false })
        .order("time_taken", { ascending: true });

      if (!err4 && motionProblemRaw)
        setMotionProblemData(motionProblemRaw.map((r) => normalizeRow(r)));
    } catch (e) {
      console.error("Unexpected fetch error", e);
      setSolvingData([]);
      setProblemSolvingData([]);
      setMotionSolvingData([]);
      setMotionProblemData([]);
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
              <td style={tdStyle}>{row.profiles?.lastname || "-"}</td>
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
          <IonTitle>Admin Leaderboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* ✅ Arithmetic Leaderboard (only Arithmetic Sequence) */}
        <h1 style={mainTitle}>Arithmetic Leaderboard</h1>

        <div style={cardStyle}>
          <h2 style={blackTitle}>Solving</h2>
          <div style={iconWrapper}>
            <Trophy size={20} color="#f59e0b" />
          </div>
          {loading ? <p>Loading...</p> : renderTable(solvingData)}
        </div>

        <div style={{ ...cardStyle, marginTop: 18 }}>
          <h2 style={blackTitle}>Problem Solving</h2>
          <div style={iconWrapper}>
            <Trophy size={20} color="#3b82f6" />
          </div>
          {loading ? <p>Loading...</p> : renderTable(problemSolvingData)}
        </div>

        {/* ✅ Motion Leaderboard (only Uniform Motion in Physics) */}
        <h1 style={{ ...mainTitle, marginTop: 30 }}>
          Uniform Motion Leaderboard
        </h1>

        <div style={cardStyle}>
          <h2 style={blackTitle}>Solving</h2>
          <div style={iconWrapper}>
            <Trophy size={20} color="#f59e0b" />
          </div>
          {loading ? <p>Loading...</p> : renderTable(motionSolvingData)}
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

/* Styles */
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
