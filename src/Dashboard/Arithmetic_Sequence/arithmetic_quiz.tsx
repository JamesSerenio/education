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

      if (error) {
        console.error("Error fetching quizzes:", error.message);
      } else {
        setQuizzes(data || []);
      }
    };
    fetchQuizzes();
  }, []);

  // ✅ Filter quizzes based on selected category
  const filteredQuizzes = selectedCategory
    ? quizzes.filter((quiz) => quiz.category === selectedCategory)
    : [];

  // ✅ Helper para i-display ang tamang label
  const getCategoryLabel = (category: string) => {
    return category === "Solving" ? "Number Solving" : category;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Arithmetic Sequence Quiz</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Step 1: Select category */}
        {!selectedCategory ? (
          <>
            <h2 style={{ marginBottom: "15px" }}>Select Categories</h2>
            <div style={{ display: "flex", gap: "10px" }}>
              <IonButton
                expand="block"
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
          </>
        ) : (
          <>
            <h2>{getCategoryLabel(selectedCategory)} Quizzes</h2>
            {filteredQuizzes.length === 0 ? (
              <p>No quizzes available for this category.</p>
            ) : (
              filteredQuizzes.map((quiz) => (
                <IonItem key={quiz.id}>
                  <IonLabel>
                    <h2>{quiz.question}</h2>
                    <p>Category: {getCategoryLabel(quiz.category)}</p>
                    <p>Level: {quiz.level}</p>
                  </IonLabel>
                </IonItem>
              ))
            )}
            {/* Back button */}
            <IonButton
              expand="block"
              fill="outline"
              style={{ marginTop: "20px" }}
              onClick={() => setSelectedCategory(null)}
            >
              Back to Categories
            </IonButton>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ArithmeticQuiz;
