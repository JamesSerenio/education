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
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [delayTime, setDelayTime] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showTransitionScreen, setShowTransitionScreen] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState("");
  const [showYesNo, setShowYesNo] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const delayRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

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
    if (buildQueue[0]) setDelayTime(15);
  };

  // --- Timer logic ---
  useEffect(() => {
    if (!currentQuiz) return;
    clearAllTimers();
    setTimeLeft(0);
    setDelayTime(15);

    delayRef.current = setInterval(() => {
      setDelayTime((prev) => {
        if (!prev) return null;
        if (prev <= 1) {
          clearInterval(delayRef.current!);
          setDelayTime(null);

          const totalTime = DIFFICULTY_TIMERS[currentQuiz.difficulty];
          setTimeLeft(totalTime);
          startTimeRef.current = Date.now(); // Start tracking per question

          timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev <= 1) {
                clearInterval(timerRef.current!);
                handleNext(true); // auto next
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearAllTimers();
  }, [currentQuiz]);

  // --- Handle Next ---
  const handleNext = useCallback(
    (auto = false) => {
      if (!currentQuiz) return;

      const now = Date.now();
      const elapsedSeconds = Math.round((now - startTimeRef.current) / 1000);

      let timeUsedForThis = 0;
      if (delayTime !== null) {
        timeUsedForThis = 0; // answered during reading
      } else if (auto) {
        timeUsedForThis = DIFFICULTY_TIMERS[currentQuiz.difficulty]; // time ran out
      } else {
        timeUsedForThis = elapsedSeconds;
      }

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

      // --- Move to next ---
      const remaining = quizQueue
        .slice(currentQuizIndex + 1)
        .filter((q) => q.difficulty === currentQuiz.difficulty);

      if (remaining.length > 0) {
        const nextIndex = currentQuizIndex + 1;
        setCurrentQuizIndex(nextIndex);
        setCurrentQuiz(quizQueue[nextIndex]);
        setUserAnswer("");
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
          `✅ You completed all ${currentQuiz.difficulty} questions.\nYour score: ${levelScore}/5\nProceed to ${nextDiff} level?`
        );
        setShowTransitionScreen(true);
        setShowYesNo(true);
      } else {
        const totalScore =
          userSolutions.filter((s) => s.isCorrect).length + (isCorrect ? 1 : 0);
        const totalTimeUsed =
          userSolutions.reduce((sum, s) => sum + (s.timeUsed || 0), 0) +
          timeUsedForThis;

        saveResult(totalScore, totalTimeUsed);
        setShowResultModal(true);
      }
    },
    [currentQuiz, currentQuizIndex, quizQueue, userAnswer, userSolutions, delayTime]
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
            setDelayTime(15);
            setShowTransitionScreen(false);
          }
        }
        return prev - 1;
      });
    }, 1000);
  };

  // --- Save results to DB ---
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

  // --- Render UI ---
  return (
    <IonPage className="quiz-container">
      <IonHeader>
        <IonToolbar color="light">
          <IonTitle>Arithmetic Quiz</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* Category Selection */}
        {!selectedCategory ? (
          <div className="quiz-category">
            <h2>Select Category</h2>
            {["Word Problem", "Problem Solving"].map((cat) => (
              <IonButton key={cat} onClick={() => startQuiz(cat)}>
                {cat}
              </IonButton>
            ))}
          </div>
        ) : showTransitionScreen ? (
          <div className="transition-screen">
            <h2>Level Complete!</h2>
            <p>{transitionMessage}</p>

            {showYesNo && (
              <>
                <IonButton color="success" onClick={proceedNextLevel}>
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
                >
                  No
                </IonButton>
              </>
            )}
            {!showYesNo && <h3>⏳ {countdown}</h3>}
          </div>
        ) : currentQuiz ? (
          <div className="quiz-content">
            {/* Timer */}
            {delayTime !== null ? (
              <div>{`📖 Reading Time: ${delayTime}s`}</div>
            ) : (
              <div>{`⏳ Time Left: ${timeLeft}s`}</div>
            )}

            <h3>{currentQuiz.difficulty}</h3>
            <p>{currentQuiz.question}</p>

            <IonItem>
              <IonInput
                value={userAnswer}
                placeholder="Enter your answer"
                onIonInput={(e) => setUserAnswer(e.detail.value ?? "")}
              />
            </IonItem>

            {errorMessage && <IonText color="danger">{errorMessage}</IonText>}

            <IonButton expand="block" onClick={() => handleNext(false)}>
              Next
            </IonButton>
          </div>
        ) : (
          <p>Loading...</p>
        )}

        {/* Result Modal */}
        <IonModal isOpen={showResultModal}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Results</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <h2>Quiz Completed!</h2>
            <h3>
              Score: {score}/{userSolutions.length}
            </h3>
            <ul>
              {userSolutions.map((res, i) => (
                <li key={i}>
                  <b>Q{i + 1}:</b> {res.question}
                  <br />
                  <b>Your Answer:</b> {res.userAnswer}
                  <br />
                  <b>Correct:</b> {res.correct}
                  <br />
                  <b>Time Used:</b> {res.timeUsed}s
                </li>
              ))}
            </ul>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default ArithmeticQuiz;
