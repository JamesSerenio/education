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

const ArithmeticQuiz: React.FC = () => {
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]); // all fetched quizzes for the subject
  const [quizzes, setQuizzes] = useState<Quiz[]>([]); // selected one-per-level quizzes (ordered level 1..5)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [score, setScore] = useState<number>(0);
  const [userSolutions, setUserSolutions] = useState<
    { question: string; correct: string; solution: string; isCorrect: boolean }[]
  >([]);

  const [showResultModal, setShowResultModal] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(TIME_PER_QUESTION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionIdRef = useRef<string | null>(null);

  // Track total time taken
  const [startTime, setStartTime] = useState<number | null>(null);

  // Autofocus input
  const inputRef = useRef<HTMLIonInputElement | null>(null);

  // ---------- Helper: pick 1 random per level (1..5) from a pool ----------
  const pickOnePerLevel = (pool: Quiz[], minLevel = 1, maxLevel = 5): Quiz[] => {
    const picks: Quiz[] = [];
    for (let lvl = minLevel; lvl <= maxLevel; lvl++) {
      const items = pool.filter((q) => q.level === lvl);
      if (items.length === 0) continue; // skip if no questions for that level
      const idx = Math.floor(Math.random() * items.length);
      picks.push(items[idx]);
    }
    // Ensure ordered by level ascending
    picks.sort((a, b) => a.level - b.level);
    return picks;
  };

  // ---------- Fetch ALL quizzes for the subject (once) ----------
  useEffect(() => {
    const fetchAll = async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("subject", "Arithmetic Sequence");

      if (error) {
        console.error("Error fetching quizzes:", error.message);
        setAllQuizzes([]);
        return;
      }
      // store raw pool — selection per category happens on category select
      setAllQuizzes((data || []) as Quiz[]);
    };

    fetchAll();
  }, []);

  // ---------- When user selects a category: build one-random-per-level set ----------
  const handleCategorySelect = useCallback(
    (category: string) => {
      setSelectedCategory(category);

      // Filter from allQuizzes by chosen category
      const pool = allQuizzes.filter((q) => q.category === category);

      // pick one per level (1..5). If a level has 0 items, it will be skipped.
      const selectedPerLevel = pickOnePerLevel(pool, 1, 5);

      // set the "quizzes" to the selected set and start from the first one
      setQuizzes(selectedPerLevel);
      setCurrentQuiz(selectedPerLevel.length > 0 ? selectedPerLevel[0] : null);
      setScore(0);
      setUserSolutions([]);
      setUserAnswer("");
      setErrorMessage("");
      setStartTime(Date.now());

      // reset timer for first question
      setTimeLeft(TIME_PER_QUESTION);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    },
    [allQuizzes]
  );

  // ---------- Next button handler ----------
  const handleNext = useCallback(() => {
    if (!currentQuiz || !selectedCategory) return;

    // Validate answer
    if (!userAnswer.trim()) {
      setErrorMessage("Please enter your answer before proceeding.");
      return;
    }
    setErrorMessage("");

    const isCorrect =
      userAnswer.trim().toLowerCase() === currentQuiz.answer.trim().toLowerCase();

    // update score using local var to avoid stale state issues
    setScore((prev) => (isCorrect ? prev + 1 : prev));

    setUserSolutions((prev) => [
      ...prev,
      {
        question: currentQuiz.question,
        correct: currentQuiz.answer,
        solution: currentQuiz.solution,
        isCorrect,
      },
    ]);

    // find index within the selected 'quizzes' array (the one-per-level set)
    const idx = quizzes.findIndex((q) => q.id === currentQuiz.id);

    // clear timer for current question immediately
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (idx >= 0 && idx < quizzes.length - 1) {
      // move to next question in the selected set
      const next = quizzes[idx + 1];
      setCurrentQuiz(next);
      setUserAnswer("");
      setTimeLeft(TIME_PER_QUESTION);
      // start timer for next question in the timer effect (it watches currentQuiz)
    } else {
      // quiz finished
      setShowResultModal(true);

      // compute total time taken in seconds
      const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

      // Save result (uses first selected quiz id as representative; adjust if you need different mapping)
      // You can change quizId to some static id if you have a quiz set id in your schema.
      const quizIdToSave = quizzes[0]?.id ?? currentQuiz.id;
      saveResult(quizIdToSave, isCorrect ? score + 1 : score, timeTaken);
    }
  }, [currentQuiz, selectedCategory, userAnswer, quizzes, score, startTime]);

  // ---------- Timer effect: restart on new currentQuiz ----------
  useEffect(() => {
    if (!currentQuiz) return;

    // If question changed, reset timer
    if (questionIdRef.current !== currentQuiz.id) {
      questionIdRef.current = currentQuiz.id;

      // reset time left
      setTimeLeft(TIME_PER_QUESTION);

      // clear old interval
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // start new interval
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // time's up -> auto next
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            // call handleNext (wrap in setTimeout to avoid React state update during render)
            setTimeout(() => {
              handleNext();
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // cleanup when currentQuiz changes/unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentQuiz, handleNext]);

  // ---------- Auto-focus input when question changes ----------
  useEffect(() => {
    if (currentQuiz && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.setFocus();
      }, 200);
    }
  }, [currentQuiz]);

  // ---------- Save result to Supabase ----------
  const saveResult = async (quizId: string, finalScore: number, timeTakenSeconds?: number) => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        console.warn("⚠️ No active session. Cannot save score.");
        return;
      }

      const userId = session.user.id;

      const payload = {
        user_id: userId,
        quiz_id: quizId,
        score: finalScore,
        time_taken: timeTakenSeconds ?? (startTime ? Math.floor((Date.now() - startTime!) / 1000) : 0),
      };

      const { error: insertError } = await supabase.from("scores").insert([payload]);

      if (insertError) {
        console.error("❌ Error saving score:", insertError.message);
      } else {
        console.log("✅ Score saved successfully!", payload);
      }
    } catch (err) {
      console.error("Unexpected error saving score:", err);
    }
  };

  const getMessage = () => {
    switch (score) {
      case 0:
        return "😢 Better luck next time!";
      case 1:
        return "🙂 You got 1 correct, keep practicing!";
      case 2:
        return "👍 Nice effort, you got 2 correct!";
      case 3:
        return "👏 Good job! 3 correct answers!";
      case 4:
        return "🔥 Almost perfect! You got 4!";
      case 5:
        return "🏆 Perfect score! Excellent work!";
      default:
        return "🎉 Quiz completed!";
    }
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
          <IonTitle>Arithmetic Sequence Quiz</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="quiz-content">
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
              <IonButton expand="block" color="primary" onClick={() => handleCategorySelect("Problem Solving")}>
                Problem Solving
              </IonButton>
              <IonButton expand="block" color="secondary" onClick={() => handleCategorySelect("Solving")}>
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
            {/* Timer */}
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: timeLeft <= 5 ? "red" : "#333",
                marginBottom: "10px",
                fontFamily: "monospace",
              }}
            >
              Time Left: {formatTime(timeLeft)}
            </div>

            <h2 style={{ fontSize: "22px", marginBottom: "10px", color: "#666" }}>{selectedCategory}</h2>

            <h1 style={{ fontSize: "28px", marginBottom: "15px" }}>Level {currentQuiz.level}</h1>

            <p style={{ fontSize: "20px", marginBottom: "25px" }}>{currentQuiz.question}</p>

            <IonItem
              style={{
                maxWidth: "400px",
                width: "100%",
                marginBottom: "10px",
                justifyContent: "center",
              }}
            >
              <IonInput
                ref={inputRef}
                value={userAnswer}
                placeholder="Enter your answer"
                onIonInput={(e) => setUserAnswer((e.target as unknown as HTMLInputElement).value ?? "")}
                clearInput
                style={{ textAlign: "center", fontSize: "18px" }}
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
                setScore(0);
                setUserSolutions([]);
                if (timerRef.current) clearInterval(timerRef.current);
              }}
            >
              Back to Categories
            </IonButton>
          </div>
        ) : (
          <p style={{ textAlign: "center", marginTop: "50px" }}>Loading quizzes...</p>
        )}

        {/* Result Modal */}
        <IonModal isOpen={showResultModal} backdropDismiss={false}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              padding: "20px",
            }}
          >
            <div style={{ flex: 1, overflowY: "auto", paddingRight: "10px" }}>
              <h2>{getMessage()}</h2>
              <h3>
                Your Score: {score}/{userSolutions.length}
              </h3>

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
                      <strong>Solution:</strong>
                      <pre
                        style={{
                          whiteSpace: "pre-wrap",
                          fontFamily: "inherit",
                          margin: "5px 0",
                        }}
                      >
                        {res?.solution || "No solution provided."}
                      </pre>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <IonButton
              expand="block"
              style={{ marginTop: "15px" }}
              onClick={() => {
                // Reset everything and go back to categories
                setSelectedCategory(null);
                setCurrentQuiz(null);
                setUserAnswer("");
                setErrorMessage("");
                setScore(0);
                setUserSolutions([]);
                setShowResultModal(false);
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                  timerRef.current = null;
                }
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
