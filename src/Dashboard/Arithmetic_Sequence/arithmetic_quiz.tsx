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
  IonModal,
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
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [score, setScore] = useState<number>(0);
  const [userSolutions, setUserSolutions] = useState<
    { question: string; correct: string; solution: string; isCorrect: boolean }[]
  >([]);

  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    const fetchQuizzes = async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("subject", "Arithmetic Sequence")
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
      setScore(0);
      setUserSolutions([]);
    }
  };

  const handleNext = () => {
    if (!userAnswer.trim()) {
      setErrorMessage("⚠️ Please enter your answer before proceeding.");
      return;
    }

    setErrorMessage("");
    if (!currentQuiz || !selectedCategory) return;

    const isCorrect =
      userAnswer.trim().toLowerCase() ===
      currentQuiz.answer.trim().toLowerCase();

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setUserSolutions((prev) => [
      ...prev,
      {
        question: currentQuiz.question,
        correct: currentQuiz.answer,
        solution: currentQuiz.solution,
        isCorrect,
      },
    ]);

    const filtered = quizzes
      .filter((q) => q.category === selectedCategory)
      .sort((a, b) => a.level - b.level);

    const currentIndex = filtered.findIndex((q) => q.id === currentQuiz.id);
    if (currentIndex < filtered.length - 1) {
      setCurrentQuiz(filtered[currentIndex + 1]);
      setUserAnswer("");
    } else {
      // ✅ Finished all quizzes → show modal
      setShowResultModal(true);
    }
  };

  const getMessage = () => {
    let message = "";

    switch (score) {
      case 0:
        message = "😢 Better luck next time!";
        break;
      case 1:
        message = "🙂 You got 1 correct, keep practicing!";
        break;
      case 2:
        message = "👍 Nice effort, you got 2 correct!";
        break;
      case 3:
        message = "👏 Good job! 3 correct answers!";
        break;
      case 4:
        message = "🔥 Almost perfect! You got 4!";
        break;
      case 5:
        message = "🏆 Perfect score! Excellent work!";
        break;
      default:
        message = "🎉 Quiz completed!";
    }

    return message;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Arithmetic Sequence Quiz</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {!selectedCategory ? (
          // Category Screen
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
          // Quiz Screen
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

            <IonButton
              expand="block"
              onClick={handleNext}
              style={{ marginTop: "15px" }}
            >
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
                setScore(0);
                setUserSolutions([]);
              }}
            >
              Back to Categories
            </IonButton>
          </div>
        ) : (
          <p style={{ textAlign: "center", marginTop: "50px" }}>
            Loading quizzes...
          </p>
        )}

        {/* ✅ Result Modal */}
        <IonModal isOpen={showResultModal} backdropDismiss={false}>
          <div
            style={{
              padding: "30px 20px",
              textAlign: "center",
            }}
          >
            <h2>{getMessage()}</h2>
            <h3>Your Score: {score}/5</h3>

            <div style={{ textAlign: "left", marginTop: "20px" }}>
              <h4>Answers & Solutions:</h4>
              <ul>
                {userSolutions.map((res, index) => (
                  <li
                    key={index}
                    style={{
                      marginBottom: "15px",
                      color: res.isCorrect ? "green" : "red",
                    }}
                  >
                    <strong>Q:</strong> {res.question}
                    <br />
                    <strong>Correct Answer:</strong> {res.correct}
                    <br />
                    <strong>Solution:</strong> {res.solution}
                  </li>
                ))}
              </ul>
            </div>

            <IonButton
              expand="block"
              style={{ marginTop: "20px" }}
              onClick={() => {
                setSelectedCategory(null);
                setCurrentQuiz(null);
                setUserAnswer("");
                setErrorMessage("");
                setScore(0);
                setUserSolutions([]);
                setShowResultModal(false);
              }}
            >
              Back to Categories
            </IonButton>
          </div>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default ArithmeticQuiz;
