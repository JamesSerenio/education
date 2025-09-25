import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonButton,
  IonInput,
  IonText,
  IonToast,
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

const MotionQuiz: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [showCompletionToast, setShowCompletionToast] = useState(false);

  useEffect(() => {
    const fetchQuizzes = async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("subject", "Uniform Motion in Physics")
        .order("level", { ascending: true });

      if (error) console.error("Error fetching quizzes:", error.message);
      else setQuizzes(data || []);
    };
    fetchQuizzes();
  }, []);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    const filtered = quizzes
      .filter((q) => q.category === category)
      .sort((a, b) => a.level - b.level);

    if (filtered.length > 0) {
      setCurrentQuiz(filtered[0]);
    }
  };

  const handleNext = () => {
    if (!userAnswer.trim()) {
      setErrorMessage("⚠️ Please enter your answer before proceeding.");
      return;
    }

    setErrorMessage("");

    if (!currentQuiz || !selectedCategory) return;

    const filtered = quizzes
      .filter((q) => q.category === selectedCategory)
      .sort((a, b) => a.level - b.level);

    const currentIndex = filtered.findIndex((q) => q.id === currentQuiz.id);

    if (currentIndex < filtered.length - 1) {
      setCurrentQuiz(filtered[currentIndex + 1]);
      setUserAnswer("");
    } else {
      // ✅ Show toast kapag tapos na
      setShowCompletionToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Uniform Motion in Physics Quiz</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {!selectedCategory ? (
          // ✅ Category Screen
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "center",
              textAlign: "center",
              paddingTop: "60px",
            }}
          >
            <h2 style={{ marginBottom: "20px" }}>Select Categories</h2>
            <div style={{ display: "flex", gap: "15px" }}>
              <IonButton
                expand="block"
                color="primary"
                onClick={() => handleCategorySelect("Problem Solving")}
              >
                Problem Solving
              </IonButton>
              <IonButton
                expand="block"
                color="secondary"
                onClick={() => handleCategorySelect("Solving")}
              >
                Number Solving
              </IonButton>
            </div>
          </div>
        ) : currentQuiz ? (
          // ✅ Quiz Screen
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "center",
              textAlign: "center",
              height: "100%",
              padding: "30px 20px",
              boxSizing: "border-box",
            }}
          >
            <h2 style={{ fontSize: "22px", marginBottom: "10px", color: "#666" }}>
              {selectedCategory}
            </h2>

            <h1 style={{ fontSize: "28px", marginBottom: "15px" }}>
              Level {currentQuiz.level}
            </h1>

            <p style={{ fontSize: "20px", marginBottom: "25px" }}>
              {currentQuiz.question}
            </p>

            <IonItem
              style={{
                maxWidth: "400px",
                width: "100%",
                marginBottom: "10px",
              }}
            >
              <IonInput
                value={userAnswer}
                placeholder="Enter your answer"
                onIonInput={(e) => setUserAnswer(e.detail.value!)}
                clearInput
              />
            </IonItem>

            {errorMessage && (
              <IonText color="danger">
                <p>{errorMessage}</p>
              </IonText>
            )}

            <IonButton expand="block" onClick={handleNext} style={{ marginTop: "15px" }}>
              Next
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              color="medium"
              style={{ marginTop: "15px" }}
              onClick={() => {
                setSelectedCategory(null);
                setCurrentQuiz(null);
                setUserAnswer("");
                setErrorMessage("");
              }}
            >
              Back to Categories
            </IonButton>
          </div>
        ) : (
          <p style={{ textAlign: "center", marginTop: "50px" }}>Loading quizzes...</p>
        )}

        {/* ✅ Completion Toast */}
        <IonToast
          isOpen={showCompletionToast}
          message="🎉 You have completed all quizzes for this category!"
          duration={2000}
          position="top"
          color="success"
          onDidDismiss={() => {
            setShowCompletionToast(false);
            setSelectedCategory(null);
            setCurrentQuiz(null);
            setUserAnswer("");
          }}
        />
      </IonContent>
    </IonPage>
  );
};

export default MotionQuiz;
