import React, { useEffect, useState, useRef, useCallback } from "react";
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
  difficulty: "Easy" | "Average" | "Difficult";
  question: string;
  solution: string;
  answer: string;
  accepted_answers?: string[];
}

const DIFFICULTY_TIMERS: Record<Quiz["difficulty"], number> = {
  Easy: 15,
  Average: 30,
  Difficult: 60,
};

const QUESTIONS_PER_DIFFICULTY = 5;

const ArithmeticQuiz: React.FC = () => {
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Quiz["difficulty"] | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [userSolutions, setUserSolutions] = useState<
    {
      question: string;
      correct: string;
      userAnswer: string;
      solution: string;
      isCorrect: boolean;
    }[]
  >([]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLIonInputElement | null>(null);

  // Fetch quizzes from Supabase
  useEffect(() => {
    const fetchQuizzes = async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("subject", "Arithmetic Sequence");

      if (error) console.error("Error fetching quizzes:", error.message);
      else setAllQuizzes(data || []);
    };
    fetchQuizzes();
  }, []);

  // Handle difficulty selection
  const handleDifficultySelect = (difficulty: Quiz["difficulty"]) => {
    setSelectedDifficulty(difficulty);

    const filtered = allQuizzes
      .filter((q) => q.difficulty === difficulty)
      .sort(() => Math.random() - 0.5)
      .slice(0, QUESTIONS_PER_DIFFICULTY);

    if (filtered.length > 0) {
      setQuizzes(filtered);
      setCurrentQuiz(filtered[0]);
      setScore(0);
      setUserSolutions([]);
      setUserAnswer("");
      setTimeLeft(DIFFICULTY_TIMERS[difficulty]);
    }
  };

  // Timer per question
  useEffect(() => {
    if (!currentQuiz) return;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleNext(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuiz]);

  // Handle next question
  const handleNext = useCallback(
    (auto = false) => {
      if (!currentQuiz || !selectedDifficulty) return;

      if (!auto && !userAnswer.trim()) {
        setErrorMessage("⚠️ Please enter your answer before proceeding.");
        return;
      }

      setErrorMessage("");

      const normalizedAnswer = userAnswer.trim().toLowerCase();
      const correctAnswer = currentQuiz.answer.trim().toLowerCase();
      const alternates = (currentQuiz.accepted_answers || []).map((a) => a.trim().toLowerCase());

      const isCorrect = normalizedAnswer === correctAnswer || alternates.includes(normalizedAnswer);
      setScore((prev) => (isCorrect ? prev + 1 : prev));

      setUserSolutions((prev) => [
        ...prev,
        {
          question: currentQuiz.question,
          correct: currentQuiz.answer,
          userAnswer: userAnswer || "(no answer)",
          solution: currentQuiz.solution,
          isCorrect,
        },
      ]);

      const currentIndex = quizzes.findIndex((q) => q.id === currentQuiz.id);

      if (currentIndex < quizzes.length - 1) {
        setCurrentQuiz(quizzes[currentIndex + 1]);
        setUserAnswer("");
        setTimeLeft(DIFFICULTY_TIMERS[selectedDifficulty]);
      } else {
        clearInterval(timerRef.current!);
        setShowResultModal(true);
        saveResult(score + (isCorrect ? 1 : 0));
      }
    },
    [currentQuiz, quizzes, userAnswer, score, selectedDifficulty]
  );

  // Save quiz result
  const saveResult = async (finalScore: number) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;
      const userId = session.user.id;

      await supabase.from("scores").insert([
        {
          user_id: userId,
          quiz_id: quizzes[0]?.id || null,
          score: finalScore,
          time_taken: DIFFICULTY_TIMERS[selectedDifficulty!] * quizzes.length,
        },
      ]);
    } catch (err) {
      console.error("Error saving score:", err);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Arithmetic Quiz</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {!selectedDifficulty ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <h2>Select Difficulty</h2>
            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", justifyContent: "center" }}>
              {["Easy", "Average", "Difficult"].map((diff) => (
                <IonButton key={diff} onClick={() => handleDifficultySelect(diff as Quiz["difficulty"])}>
                  {diff}
                </IonButton>
              ))}
            </div>
          </div>
        ) : currentQuiz ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "25px 10px 100px" }}>
            <div
              style={{
                fontSize: "22px",
                fontWeight: "bold",
                color: timeLeft <= 5 ? "red" : "#333",
                marginBottom: "10px",
              }}
            >
              ⏳ Time Left: {timeLeft}s
            </div>

            <h2>{selectedDifficulty}</h2>
            <p style={{ textAlign: "center", fontSize: "18px", margin: "10px 0" }}>{currentQuiz.question}</p>

            <IonItem style={{ width: "90%", maxWidth: "400px", marginTop: "10px" }}>
              <IonInput
                ref={inputRef}
                value={userAnswer}
                placeholder="Enter your answer"
                onIonInput={(e) => setUserAnswer(e.detail.value!)}
                style={{ textAlign: "center" }}
              />
            </IonItem>

            {errorMessage && <IonText color="danger">{errorMessage}</IonText>}

            <IonButton expand="block" onClick={() => handleNext(false)} style={{ marginTop: "20px" }}>
              Next
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              color="medium"
              onClick={() => {
                setSelectedDifficulty(null);
                setCurrentQuiz(null);
                setUserAnswer("");
                setErrorMessage("");
                setScore(0);
                setUserSolutions([]);
                clearInterval(timerRef.current!);
              }}
              style={{ marginTop: "10px" }}
            >
              Back to Categories
            </IonButton>
          </div>
        ) : (
          <p style={{ textAlign: "center", marginTop: "50px" }}>Loading...</p>
        )}

        <IonModal isOpen={showResultModal} backdropDismiss={false}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Results</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent style={{ padding: "20px", overflowY: "auto" }}>
            <h2>Quiz Completed!</h2>
            <h3>
              Score: {score}/{userSolutions.length}
            </h3>
            <ul style={{ textAlign: "left" }}>
              {userSolutions.map((res, i) => (
                <li
                  key={i}
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: "10px",
                    padding: "10px",
                    marginBottom: "15px",
                    background: res.isCorrect ? "#e6ffe6" : "#ffe6e6",
                  }}
                >
                  <b>Q{i + 1}:</b> {res.question}
                  <br />
                  <b>Your Answer:</b>{" "}
                  <span style={{ color: res.isCorrect ? "green" : "red" }}>{res.userAnswer}</span>
                  <br />
                  <b>Correct Answer:</b> {res.correct}
                  <br />
                  <b>Solution:</b>
                  <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{res.solution || "No solution provided."}</pre>
                </li>
              ))}
            </ul>
            <IonButton
              expand="block"
              onClick={() => {
                setShowResultModal(false);
                setSelectedDifficulty(null);
                setCurrentQuiz(null);
                setUserAnswer("");
                setUserSolutions([]);
              }}
              style={{ marginTop: "20px" }}
            >
              Back to Categories
            </IonButton>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default ArithmeticQuiz;
