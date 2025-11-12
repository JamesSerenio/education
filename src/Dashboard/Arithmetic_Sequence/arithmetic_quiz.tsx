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
  Easy: 60,
  Average: 180,
  Difficult: 300,
};

const QUESTIONS_PER_DIFFICULTY = 5;
const difficultyOrder: Quiz["difficulty"][] = ["Easy", "Average", "Difficult"];

const ArithmeticQuiz: React.FC = () => {
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [quizQueue, setQuizQueue] = useState<Quiz[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
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
      timeUsed: number;
      difficulty: Quiz["difficulty"];
    }[]
  >([]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [timeUsed, setTimeUsed] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showTransitionScreen, setShowTransitionScreen] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState("");
  const [showYesNo, setShowYesNo] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [delayTime, setDelayTime] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const delayRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (delayRef.current) clearInterval(delayRef.current);
    timerRef.current = null;
    delayRef.current = null;
  };

  // --- Fetch quizzes ---
  useEffect(() => {
    const fetchQuizzes = async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("subject", "Arithmetic Sequence")
        .in("category", ["Word Problem", "Problem Solving"]);

      if (error) console.error("Error fetching quizzes:", error.message);
      else setAllQuizzes((data as Quiz[]) || []);
    };
    fetchQuizzes();
  }, []);

  // --- Start quiz ---
  const startQuiz = (category: string) => {
    setSelectedCategory(category);
    const categoryQuizzes = allQuizzes.filter((q) => q.category === category);
    const buildQueue = difficultyOrder.flatMap((difficulty) =>
      categoryQuizzes
        .filter((q) => q.difficulty === difficulty)
        .sort(() => Math.random() - 0.5)
        .slice(0, QUESTIONS_PER_DIFFICULTY)
    );

    setQuizQueue(buildQueue);
    setCurrentQuizIndex(0);
    setCurrentQuiz(buildQueue[0] || null);
    setUserSolutions([]);
    setUserAnswer("");
    setScore(0);
    setTimeUsed(0);
    if (buildQueue[0]) setDelayTime(15);
  };

  // --- Timer logic ---
  useEffect(() => {
    if (!currentQuiz) return;
    clearAllTimers();
    setTimeLeft(0);
    setTimeUsed(0);
    setDelayTime(15);

    // Countdown before the actual timer starts
    delayRef.current = setInterval(() => {
      setDelayTime((prev) => {
        if (!prev) return null;
        if (prev <= 1) {
          clearInterval(delayRef.current!);
          setDelayTime(null);

          const totalTime = DIFFICULTY_TIMERS[currentQuiz.difficulty];
          setTimeLeft(totalTime);

          timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev <= 1) {
                clearInterval(timerRef.current!);
                handleNext(true); // auto-submit on timeout
                return 0;
              }
              return prev - 1;
            });
            setTimeUsed((prev) => prev + 1);
          }, 1000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearAllTimers();
  }, [currentQuiz]);

  // --- Next question / level ---
  const handleNext = useCallback(
    (auto = false) => {
      if (!currentQuiz) return;

      // ✅ if reading time (delayTime still active)
      const isDuringReadingTime = delayTime !== null;

      if (!auto && !userAnswer.trim()) {
        setErrorMessage("⚠️ Please enter your answer before proceeding.");
        return;
      }
      setErrorMessage("");

      const normalizedAnswer = userAnswer.trim().toLowerCase();
      const correctAnswer = currentQuiz.answer.trim().toLowerCase();
      const alternates = (currentQuiz.accepted_answers || []).map((a) =>
        a.trim().toLowerCase()
      );
      const isCorrect =
        normalizedAnswer === correctAnswer || alternates.includes(normalizedAnswer);

      // ✅ Fix logic for timeUsed:
      let timeUsedForThis = 0;
      if (isDuringReadingTime) {
        timeUsedForThis = 0; // answered during reading phase
      } else if (auto || !isCorrect) {
        timeUsedForThis = DIFFICULTY_TIMERS[currentQuiz.difficulty]; // full time if timeout or wrong
      } else {
        timeUsedForThis = Math.max(timeUsed, 1); // actual time if correct
      }

      setScore((prev) => (isCorrect ? prev + 1 : prev));

      setUserSolutions((prev) => [
        ...prev,
        {
          question: currentQuiz.question,
          correct: currentQuiz.answer,
          userAnswer: userAnswer || "(no answer)",
          solution: currentQuiz.solution,
          isCorrect,
          timeUsed: timeUsedForThis,
          difficulty: currentQuiz.difficulty,
        },
      ]);

      // --- Move to next question ---
      const remaining = quizQueue
        .slice(currentQuizIndex + 1)
        .filter((q) => q.difficulty === currentQuiz.difficulty);

      if (remaining.length > 0) {
        const nextIndex = currentQuizIndex + 1;
        setCurrentQuizIndex(nextIndex);
        setCurrentQuiz(quizQueue[nextIndex]);
        setUserAnswer("");
        setTimeUsed(0);
        setDelayTime(15);
        return;
      }

      // --- Move to next difficulty or finish ---
      const nextDiffIndex = difficultyOrder.indexOf(currentQuiz.difficulty) + 1;
      const nextDiff = difficultyOrder[nextDiffIndex];

      if (nextDiff) {
        const levelScore =
          userSolutions.filter(
            (q) => q.difficulty === currentQuiz.difficulty && q.isCorrect
          ).length + (isCorrect ? 1 : 0);

        setTransitionMessage(
          `✅ You completed all ${currentQuiz.difficulty} questions.\nYour score: ${levelScore}/5\nDo you want to proceed to the ${nextDiff} level?`
        );
        setShowTransitionScreen(true);
        setShowYesNo(true);
      } else {
        // --- Quiz finished ---
        const totalScore =
          userSolutions.filter((s) => s.isCorrect).length + (isCorrect ? 1 : 0);
        const totalTime =
          userSolutions.reduce((sum, s) => sum + (s.timeUsed || 0), 0) +
          timeUsedForThis;

        saveResult(totalScore, totalTime);
        setShowResultModal(true);
      }
    },
    [currentQuiz, currentQuizIndex, quizQueue, userAnswer, userSolutions, timeUsed, delayTime]
  );

  // --- Proceed next level ---
  const proceedNextLevel = () => {
    setShowYesNo(false);
    const currentDiffIndex = difficultyOrder.indexOf(currentQuiz!.difficulty);
    const nextDiff = difficultyOrder[currentDiffIndex + 1];

    setTransitionMessage(`⚡ Get ready for the ${nextDiff} level!`);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          const nextQuizIndex = quizQueue.findIndex(
            (q) => q.difficulty === nextDiff
          );
          if (nextQuizIndex !== -1) {
            setCurrentQuizIndex(nextQuizIndex);
            setCurrentQuiz(quizQueue[nextQuizIndex]);
            setUserAnswer("");
            setTimeUsed(0);
            setDelayTime(15);
            setShowTransitionScreen(false);
          }
        }
        return prev - 1;
      });
    }, 1000);
  };

  // --- Save results ---
  const saveResult = async (finalScore: number, totalTimeUsed: number) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        console.warn("No user session found.");
        return;
      }

      const userId = session.user.id;
      const easy = userSolutions.filter((s) => s.difficulty === "Easy" && s.isCorrect).length;
      const average = userSolutions.filter((s) => s.difficulty === "Average" && s.isCorrect).length;
      const difficult = userSolutions.filter((s) => s.difficulty === "Difficult" && s.isCorrect).length;

      // Use the passed totalTimeUsed directly (no need to recalculate)
      const { error } = await supabase.from("scores").insert([
        {
          user_id: userId,
          quiz_id: quizQueue[0]?.id ?? null,
          easy,
          average,
          difficult,
          time_taken: totalTimeUsed,
        },
      ]);

      if (error) console.error("❌ Error saving score:", error.message);
      else console.log("✅ Score saved:", { easy, average, difficult, totalTimeUsed });
    } catch (err) {
      console.error("❌ Unexpected error saving score:", err);
    }
  };

  return (
    <IonPage className="quiz-container">
      <IonHeader>
        <IonToolbar color="light">
          <IonTitle className="quiz-title">Arithmetic Quiz</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* Category Selection */}
        {!selectedCategory ? (
          <div className="quiz-category">
            <h2 className="quiz-heading">Select Category</h2>
            <div className="quiz-category-buttons">
              {["Word Problem", "Problem Solving"].map((cat) => (
                <IonButton key={cat} onClick={() => startQuiz(cat)} className="quiz-btn">
                  {cat}
                </IonButton>
              ))}
            </div>
          </div>
        ) : showTransitionScreen ? (
          <div className="transition-screen">
            <div className="transition-card">
              <h2 className="transition-heading">Level Complete!</h2>
              <p className="transition-text">{transitionMessage}</p>

              {showYesNo && (
                <div className="quiz-category-buttons">
                  <IonButton color="success" onClick={proceedNextLevel} className="quiz-btn">
                    Yes
                  </IonButton>
                  <IonButton
                    color="danger"
                    onClick={() => {
                      clearAllTimers();
                      setShowTransitionScreen(false);
                      setSelectedCategory(null);
                      setCurrentQuiz(null);
                      setUserAnswer("");
                      setUserSolutions([]);
                    }}
                    className="quiz-btn"
                  >
                    No
                  </IonButton>
                </div>
              )}

              {!showYesNo && <h3 className="countdown-display">⏳ {countdown}</h3>}
            </div>
          </div>
        ) : currentQuiz ? (
          <div className="quiz-content">
            {/* Timers */}
            {delayTime !== null ? (
              <div className={`quiz-timer ${delayTime <= 3 ? "critical" : ""}`}>
                {delayTime > 3
                  ? `📖 Reading Time: ${delayTime}s`
                  : `⚡ Get Ready! ${delayTime}s`}
              </div>
            ) : (
              <div className={`quiz-timer ${timeLeft <= 5 ? "critical" : ""}`}>
                ⏳ Time Left: {timeLeft}s
              </div>
            )}

            <h3 className="quiz-difficulty">{currentQuiz.difficulty}</h3>
            <p className="quiz-question">{currentQuiz.question}</p>

            <IonItem className="quiz-input-item">
              <IonInput
                value={userAnswer}
                placeholder="Enter your answer"
                onIonInput={(e) => setUserAnswer(e.detail.value ?? "")}
                className="quiz-input"
              />
            </IonItem>

            {errorMessage && <IonText className="quiz-error">{errorMessage}</IonText>}

            <IonButton expand="block" onClick={() => handleNext(false)} className="quiz-next">
              Next
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              color="medium"
              onClick={() => {
                clearAllTimers();
                setSelectedCategory(null);
                setCurrentQuiz(null);
                setUserAnswer("");
                setUserSolutions([]);
              }}
              className="quiz-back"
            >
              Back to Categories
            </IonButton>
          </div>
        ) : (
          <p className="quiz-loading">Loading...</p>
        )}

        {/* Result Modal */}
        <IonModal isOpen={showResultModal} backdropDismiss={false}>
          <IonHeader>
            <IonToolbar color="light">
              <IonTitle>Results</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent className="quiz-result-content">
            <h2>Quiz Completed!</h2>
            <h3>
              Score: {score}/{userSolutions.length}
            </h3>
            <ul className="quiz-result-list">
              {userSolutions.map((res, i) => (
                <li key={i} className={`quiz-result-item ${res.isCorrect ? "correct" : "wrong"}`}>
                  <b>Q{i + 1}:</b> {res.question}
                  <br />
                  <b>Your Answer:</b>{" "}
                  <span className={res.isCorrect ? "text-correct" : "text-wrong"}>
                    {res.userAnswer}
                  </span>
                  <br />
                  <b>Correct Answer:</b> {res.correct}
                  <br />
                  <b>Time Used:</b> {res.timeUsed}s
                  <br />
                  <b>Solution:</b>
                  <pre>{res.solution || "No solution provided."}</pre>
                </li>
              ))}
            </ul>
            <IonButton
              expand="block"
              onClick={() => {
                clearAllTimers();
                setShowResultModal(false);
                setSelectedCategory(null);
                setCurrentQuiz(null);
                setUserAnswer("");
                setUserSolutions([]);
              }}
              className="quiz-finish-btn"
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
