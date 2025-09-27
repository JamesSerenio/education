import React from "react";
import {
  IonPage,
  IonHeader,
  IonContent,
} from "@ionic/react";
import { Trophy } from "lucide-react"; // gamit natin lucide-react para sa trophy icon

const admin_leaderboard: React.FC = () => {
  // Sample data (pwede mo palitan with real data galing sa DB)
  const leaderboardData = [
    { position: 1, name: "Alice", time: "32.8s", score: 5 },
    { position: 2, name: "Bob", time: "47.2s", score: 4 },
    { position: 3, name: "Charlie", time: "56.7s", score: 3 },
    { position: 4, name: "David", time: "1:18.5", score: 2 },
  ];

  return (
    <IonPage>
      <IonHeader>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 border border-gray-300">
          {/* Title with trophy */}
          <h2 className="text-2xl font-bold text-center">Leaderboard</h2>
          <div className="flex justify-center items-center my-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span className="ml-2 font-medium">Quiz</span>
          </div>

          {/* Table */}
          <table className="w-full border border-gray-400 rounded-lg overflow-hidden text-center mt-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 border border-gray-400">Position</th>
                <th className="py-2 border border-gray-400">Name</th>
                <th className="py-2 border border-gray-400">Time</th>
                <th className="py-2 border border-gray-400">Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-2 border border-gray-400 font-medium">
                    {row.position}
                  </td>
                  <td className="py-2 border border-gray-400">{row.name}</td>
                  <td className="py-2 border border-gray-400">{row.time}</td>
                  <td className="py-2 border border-gray-400">{row.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default admin_leaderboard;
