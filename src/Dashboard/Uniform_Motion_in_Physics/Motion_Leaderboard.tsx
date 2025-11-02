import React, { useEffect, useState } from "react";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from "@ionic/react";
import { Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../../utils/supabaseClient";

interface LeaderboardRow {
  score: number;
  time_taken: number;
  lastname: string;
  category: string;
}

const UniformMotionLeaderboard: React.FC = () => {
  const [wordProblemData, setWordProblemData] = useState<LeaderboardRow[]>([]);
  const [problemSolvingData, setProblemSolvingData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    setLoading(true);
    try {
      const fetchCategory = async (category: string) => {
        // Adjust the select to match your Supabase schema
        const { data, error } = await supabase
          .from("scores")
          .select("score,time_taken,user_id,category")
          .eq("category", category)
          .eq("subject", "Uniform Motion in Physics")
          .order("score", { ascending: false })
          .order("time_taken", { ascending: true });

        if (error) {
          console.error(`${category} fetch error:`, error);
          return [];
        }

        // Fetch profile for each score
        const scoresWithProfile: LeaderboardRow[] = [];
        for (const row of data) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("lastname")
            .eq("id", row.user_id)
            .single();

          if (profileError) continue;

          scoresWithProfile.push({
            score: row.score,
            time_taken: row.time_taken,
            lastname: profileData.lastname,
            category: row.category,
          });
        }

        // Keep only highest per user
        const map = new Map<string, LeaderboardRow>();
        for (const r of scoresWithProfile) {
          const existing = map.get(r.lastname);
          if (!existing || r.score > existing.score || (r.score === existing.score && r.time_taken < existing.time_taken)) {
            map.set(r.lastname, r);
          }
        }

        return Array.from(map.values()).sort(
          (a, b) => b.score - a.score || a.time_taken - b.time_taken
        );
      };

      const wordProblem = await fetchCategory("Word Problem");
      const problemSolving = await fetchCategory("Problem Solving");

      setWordProblemData(wordProblem);
      setProblemSolvingData(problemSolving);
    } catch (err) {
      console.error("Unexpected fetch error:", err);
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
            <motion.tr
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              style={{ borderBottom: "1px solid #e5e7eb" }}
            >
              <td style={tdStyle}>{index + 1}</td>
              <td style={tdStyle}>{row.lastname || "-"}</td>
              <td style={tdStyle}>{row.score}</td>
              <td style={tdStyle}>{formatTime(row.time_taken)}</td>
            </motion.tr>
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.3, delayChildren: 0.2 }}
        >
          <motion.div style={cardStyle}>
            <h2 style={blackTitle}>Word Problem Leaderboard</h2>
            <div style={iconWrapper}>
              <Trophy size={24} color="#f59e0b" />
            </div>
            {loading ? <p>Loading...</p> : renderTable(wordProblemData)}
          </motion.div>

          <motion.div style={{ ...cardStyle, marginTop: 20 }}>
            <h2 style={blackTitle}>Problem Solving Leaderboard</h2>
            <div style={iconWrapper}>
              <Trophy size={24} color="#3b82f6" />
            </div>
            {loading ? <p>Loading...</p> : renderTable(problemSolvingData)}
          </motion.div>
        </motion.div>
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
