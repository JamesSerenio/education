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

const TIME_PER_QUESTION = 60; // seconds

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
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
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
  const [timeLeft, setTimeLeft] = useState<number>(TIME_PER_QUESTION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLIonInputElement | null>(null);
  const [questionStart, setQuestionStart] = useState<number>(Date.now());

  // ✅ Helper: pick 1 random per level (1–5)
  const pickOnePerLevel = (pool: Quiz[]): Quiz[] => {
    const picks: Quiz[] = [];
    for (let lvl = 1; lvl <= 5; lvl++) {
      const items = pool.filter((q) => q.level === lvl);
      if (items.length > 0) {
        const randomIndex = Math.floor(Math.random() * items.length);
        picks.push(items[randomIndex]);
      }
    }
    return picks.sort((a, b) => a.level - b.level);
  };

  // ✅ Fetch quizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("subject", "Uniform Motion in Physics");

      if (error) console.error("Error fetching quizzes:", error.message);
      else setAllQuizzes(data || []);
    };
    fetchQuizzes();
  }, []);

  // ✅ Start quiz
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    const filtered = allQuizzes.filter((q) => q.category === category);
    const randomPerLevel = pickOnePerLevel(filtered);

    if (randomPerLevel.length > 0) {
      setQuizzes(randomPerLevel);
      setCurrentQuiz(randomPerLevel[0]);
      setScore(0);
      setUserSolutions([]);
      setStartTime(Date.now());
      setTimeLeft(TIME_PER_QUESTION);
      setQuestionStart(Date.now());
    }
  };

  // ✅ Save result
  const saveResult = async (quizId: string, finalScore: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.warn("⚠️ No active session. Cannot save score.");
        return;
      }

      const userId = session.user.id;
      const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

      const { error } = await supabase.from("scores").insert([
        {
          user_id: userId,
          quiz_id: quizId,
          score: finalScore,
          time_taken: timeTaken,
        },
      ]);

      if (error) console.error("❌ Error saving score:", error.message);
      else console.log("✅ Score saved successfully!");
    } catch (err) {
      console.error("Unexpected error saving score:", err);
    }
  };

  // ✅ Timer logic
  useEffect(() => {
    if (!currentQuiz) return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - questionStart) / 1000);
      const remaining = TIME_PER_QUESTION - elapsed;
      setTimeLeft(remaining > 0 ? remaining : 0);

      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        handleNext(true); // auto next
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuiz, questionStart]);

  // ✅ Next question
  const handleNext = useCallback(
    (auto = false) => {
      if (!currentQuiz || !selectedCategory) return;

      if (!auto && !userAnswer.trim()) {
        setErrorMessage("⚠️ Please enter your answer before proceeding.");
        return;
      }

      setErrorMessage("");
      const isCorrect =
        userAnswer.trim().toLowerCase() === currentQuiz.answer.trim().toLowerCase();
      const newScore = isCorrect ? score + 1 : score;

      setScore(newScore);
      setUserSolutions((prev) => [
        ...prev,
        {
          question: currentQuiz.question,
          correct: currentQuiz.answer,
          solution: currentQuiz.solution,
          isCorrect,
        },
      ]);

      const currentIndex = quizzes.findIndex((q) => q.id === currentQuiz.id);
      if (currentIndex < quizzes.length - 1) {
        setCurrentQuiz(quizzes[currentIndex + 1]);
        setUserAnswer("");
        setTimeLeft(TIME_PER_QUESTION);
        setQuestionStart(Date.now());
      } else {
        setShowResultModal(true);
        clearInterval(timerRef.current!);
        saveResult(quizzes[0].id, newScore);
      }
    },
    [currentQuiz, selectedCategory, quizzes, userAnswer, score]
  );

  // ✅ Auto focus input
  useEffect(() => {
    if (currentQuiz && inputRef.current) {
      setTimeout(() => inputRef.current?.setFocus(), 200);
    }
  }, [currentQuiz]);

  const getMessage = () => {
    if (score === 0) return "😢 Better luck next time!";
    if (score === 5) return "🏆 Perfect score! Excellent work!";
    return `🎉 You got ${score} correct!`;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
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
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: "60px",
            }}
          >
            <h2>Select Category</h2>
            <div style={{ display: "flex", gap: "15px" }}>
              <IonButton onClick={() => handleCategorySelect("Problem Solving")}>
                Problem Solving
              </IonButton>
              <IonButton onClick={() => handleCategorySelect("Solving")}>
                Number Solving
              </IonButton>
            </div>
          </div>
        ) : currentQuiz ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "30px 20px",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: timeLeft <= 5 ? "red" : "#333",
                marginBottom: "10px",
                fontFamily: "monospace",
              }}
            >
             ⏳ Time Left: {formatTime(timeLeft)}
            </div>

            <h2>{selectedCategory}</h2>
            <h1>Level {currentQuiz.level}</h1>
            <p>{currentQuiz.question}</p>

            <IonItem style={{ maxWidth: "400px", width: "100%" }}>
              <IonInput
                ref={inputRef}
                value={userAnswer}
                placeholder="Enter your answer"
                onIonInput={(e) => setUserAnswer(e.detail.value!)}
                clearInput
                style={{ textAlign: "center" }}
              />
            </IonItem>

            {errorMessage && (
              <IonText color="danger">
                <p>{errorMessage}</p>
              </IonText>
            )}

            <IonButton onClick={() => handleNext(false)} style={{ marginTop: "15px" }}>
              Next
            </IonButton>

            <IonButton
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
              style={{ marginTop: "15px" }}
            >
              Back to Categories
            </IonButton>
          </div>
        ) : (
          <p style={{ textAlign: "center", marginTop: "50px" }}>Loading...</p>
        )}

        {/* ✅ Result Modal */}
        <IonModal isOpen={showResultModal} backdropDismiss={false}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Results</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent style={{ padding: "20px", overflowY: "auto" }}>
            <h2>{getMessage()}</h2>
            <h3>
              Score: {score}/{userSolutions.length}
            </h3>
            <ul style={{ textAlign: "left" }}>
              {userSolutions.map((res, i) => (
                <li
                  key={i}
                  style={{
                    color: res.isCorrect ? "green" : "red",
                    marginBottom: "15px",
                  }}
                >
                  <b>Q:</b> {res.question}
                  <br />
                  <b>Answer:</b> {res.correct}
                  <br />
                  <b>Solution:</b> {res.solution || "No solution provided."}
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

export default MotionQuiz;
