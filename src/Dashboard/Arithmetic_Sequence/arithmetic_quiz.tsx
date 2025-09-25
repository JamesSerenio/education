import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonButton,
} from "@ionic/react";
import { supabase } from "../../utils/supabaseClient";

interface Quiz {
  id: string;
  subject: string;
  category: string;
  level: number;
  question: string;
  solution: string;
  answer: string;
}

const ArithmeticQuiz: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("subject", "Arithmetic Sequence");

      if (error) console.error("Error fetching quizzes:", error.message);
      else setQuizzes(data || []);
    };
    fetchQuizzes();
  }, []);

  const filteredQuizzes = selectedCategory
    ? quizzes.filter((quiz) => quiz.category === selectedCategory)
    : [];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Arithmetic Sequence Quiz</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {!selectedCategory ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start", // nasa taas
              alignItems: "center",
              textAlign: "center",
              paddingTop: "60px", // imbes na marginTop para walang overflow
              height: "auto", // ✅ wag fixed 100%
              minHeight: "100%", // para sakto lang sa screen
              boxSizing: "border-box",
            }}
          >
            <h2 style={{ marginBottom: "20px" }}>Select Categories</h2>

            <div style={{ display: "flex", gap: "15px" }}>
              <IonButton
                expand="block"
                color="primary"
                onClick={() => setSelectedCategory("Problem Solving")}
              >
                Problem Solving
              </IonButton>
              <IonButton
                expand="block"
                color="secondary"
                onClick={() => setSelectedCategory("Solving")}
              >
                Number Solving
              </IonButton>
            </div>
          </div>
        ) : (
          <div className="ion-padding">
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
              {selectedCategory} Quizzes
            </h2>

            {filteredQuizzes.length === 0 ? (
              <p style={{ textAlign: "center" }}>
                No quizzes available for this category.
              </p>
            ) : (
              filteredQuizzes.map((quiz) => (
                <IonItem key={quiz.id}>
                  <IonLabel>
                    <h2>{quiz.question}</h2>
                    <p>Category: {quiz.category}</p>
                    <p>Level: {quiz.level}</p>
                  </IonLabel>
                </IonItem>
              ))
            )}

            <IonButton
              expand="block"
              fill="outline"
              onClick={() => setSelectedCategory(null)}
              style={{ marginTop: "20px" }}
            >
              Back to Categories
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ArithmeticQuiz;
