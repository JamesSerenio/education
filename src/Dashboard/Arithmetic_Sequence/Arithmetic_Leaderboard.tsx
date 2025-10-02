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

interface LeaderboardRow {
  score: number;
  time_taken: number;
  profiles: { lastname: string };
  quizzes: { category: string };
}

const ArithmeticLeaderboard: React.FC = () => {
  const [solvingData, setSolvingData] = useState<LeaderboardRow[]>([]);
  const [problemSolvingData, setProblemSolvingData] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    // 🔹 Fetch Solving leaderboard
    const { data: solving, error: err1 } = await supabase
      .from("scores")
      .select(
        `
        score,
        time_taken,
        profiles!inner(lastname),
        quizzes!inner(category)
      `
      )
      .eq("quizzes.category", "Solving")
      .order("score", { ascending: false })
      .order("time_taken", { ascending: true });

    if (err1) {
      console.error("Solving Error:", err1.message);
      setSolvingData([]);
    } else {
      setSolvingData(solving as LeaderboardRow[]);
    }

    // 🔹 Fetch Problem Solving leaderboard
    const { data: problem, error: err2 } = await supabase
      .from("scores")
      .select(
        `
        score,
        time_taken,
        profiles!inner(lastname),
        quizzes!inner(category)
      `
      )
      .eq("quizzes.category", "Problem Solving")
      .order("score", { ascending: false })
      .order("time_taken", { ascending: true });

    if (err2) {
      console.error("Problem Solving Error:", err2.message);
      setProblemSolvingData([]);
    } else {
      setProblemSolvingData(problem as LeaderboardRow[]);
    }
  };

  // helper to format seconds into mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const renderTable = (data: LeaderboardRow[]) => (
    <table className="w-full border border-gray-400 rounded-lg overflow-hidden text-center mt-4">
      <thead className="bg-gray-100">
        <tr>
          <th className="py-2 border border-gray-400">Place</th>
          <th className="py-2 border border-gray-400">Lastname</th>
          <th className="py-2 border border-gray-400">Score</th>
          <th className="py-2 border border-gray-400">Time</th>
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="py-2 border border-gray-400 font-medium">{index + 1}</td>
              <td className="py-2 border border-gray-400">{row.profiles?.lastname}</td>
              <td className="py-2 border border-gray-400">{row.score}</td>
              <td className="py-2 border border-gray-400">{formatTime(row.time_taken)}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td className="py-2 border border-gray-400 text-center" colSpan={4}>
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
          <IonTitle>Arithmetic Leaderboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Solving Leaderboard */}
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 border border-gray-300 mb-8">
          <h2 className="text-2xl font-bold text-center">Solving Leaderboard</h2>
          <div className="flex justify-center items-center my-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
          </div>
          {renderTable(solvingData)}
        </div>

        {/* Problem Solving Leaderboard */}
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 border border-gray-300">
          <h2 className="text-2xl font-bold text-center">Problem Solving Leaderboard</h2>
          <div className="flex justify-center items-center my-2">
            <Trophy className="w-6 h-6 text-blue-500" />
          </div>
          {renderTable(problemSolvingData)}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ArithmeticLeaderboard;
