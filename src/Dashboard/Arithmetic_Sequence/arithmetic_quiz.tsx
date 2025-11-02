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
  const [quizQueue, setQuizQueue] = useState<Quiz[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [userSolutions, setUserSolutions] = useState<
    { question: string; correct: string; userAnswer: string; solution: string; isCorrect: boolean }[]
  >([]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch quizzes from Supabase (Word Problem and Problem Solving)
  useEffect(() => {
    const fetchQuizzes = async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("subject", "Arithmetic Sequence")
        .in("category", ["Word Problem", "Problem Solving"]);

      if (error) console.error("Error fetching quizzes:", error.message);
      else setAllQuizzes(data || []);
    };
    fetchQuizzes();
  }, []);

  // Start quiz when category is selected
  const startQuiz = (category: string) => {
    setSelectedCategory(category);

    const categoryQuizzes = allQuizzes.filter((q) => q.category === category);

    const buildQueue = ["Easy", "Average", "Difficult"].flatMap((difficulty) => {
      const filtered = categoryQuizzes
        .filter((q) => q.difficulty === difficulty)
        .sort(() => Math.random() - 0.5)
        .slice(0, QUESTIONS_PER_DIFFICULTY);
      return filtered;
    });

    setQuizQueue(buildQueue);
    setCurrentQuizIndex(0);
    setCurrentQuiz(buildQueue[0] || null);
    setScore(0);
    setUserSolutions([]);
    setUserAnswer("");
    if (buildQueue[0]) setTimeLeft(DIFFICULTY_TIMERS[buildQueue[0].difficulty]);
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

  const handleNext = useCallback(
    (auto = false) => {
      if (!currentQuiz) return;

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

      // Move to next question in queue
      if (currentQuizIndex < quizQueue.length - 1) {
        const nextIndex = currentQuizIndex + 1;
        setCurrentQuizIndex(nextIndex);
        setCurrentQuiz(quizQueue[nextIndex]);
        setUserAnswer("");
        setTimeLeft(DIFFICULTY_TIMERS[quizQueue[nextIndex].difficulty]);
      } else {
        clearInterval(timerRef.current!);
        setShowResultModal(true);
        saveResult(score + (isCorrect ? 1 : 0));
      }
    },
    [currentQuiz, currentQuizIndex, quizQueue, userAnswer, score]
  );

  const saveResult = async (finalScore: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;

      await supabase.from("scores").insert([
        {
          user_id: userId,
          quiz_id: quizQueue[0]?.id || null,
          score: finalScore,
          time_taken: quizQueue.reduce((sum, q) => sum + DIFFICULTY_TIMERS[q.difficulty], 0),
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
        {!selectedCategory ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <h2>Select Category</h2>
            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", justifyContent: "center" }}>
              {["Word Problem", "Problem Solving"].map((cat) => (
                <IonButton key={cat} onClick={() => startQuiz(cat)}>
                  {cat}
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

            <h2>{currentQuiz.difficulty}</h2>
            <p style={{ textAlign: "center", fontSize: "18px", margin: "10px 0" }}>{currentQuiz.question}</p>

            <IonItem style={{ width: "90%", maxWidth: "400px", marginTop: "10px" }}>
              <IonInput
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
                setSelectedCategory(null);
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
                setSelectedCategory(null);
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
