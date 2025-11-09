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
import { motion, AnimatePresence } from "framer-motion";
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

const MotionQuiz: React.FC = () => {
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [quizQueue, setQuizQueue] = useState<Quiz[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [userSolutions, setUserSolutions] = useState<
    { question: string; correct: string; userAnswer: string; solution: string; isCorrect: boolean; timeUsed: number }[]
  >([]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timeUsed, setTimeUsed] = useState<number>(0);
  const [delayTime, setDelayTime] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const delayRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch quizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("subject", "Uniform Motion in Physics")
        .in("category", ["Word Problem", "Problem Solving"]);

      if (error) console.error("Error fetching motion quizzes:", error.message);
      else setAllQuizzes(data || []);
    };
    fetchQuizzes();
  }, []);

  const startQuiz = (category: string) => {
    setSelectedCategory(category);
    const categoryQuizzes = allQuizzes.filter((q) => q.category === category);

    const buildQueue = ["Easy", "Average", "Difficult"].flatMap((difficulty) =>
      categoryQuizzes
        .filter((q) => q.difficulty === difficulty)
        .sort(() => Math.random() - 0.5)
        .slice(0, QUESTIONS_PER_DIFFICULTY)
    );

    setQuizQueue(buildQueue);
    setCurrentQuizIndex(0);
    setCurrentQuiz(buildQueue[0] || null);
    setScore(0);
    setUserSolutions([]);
    setUserAnswer("");
    setTimeUsed(0);
    if (buildQueue[0]) setDelayTime(15);

    // Scroll to top when quiz starts
    const ionContent = document.querySelector("ion-content");
    ionContent?.scrollToTop(0);
  };

  // Timer with reading delay
  useEffect(() => {
    if (!currentQuiz) return;

    if (timerRef.current) clearInterval(timerRef.current);
    if (delayRef.current) clearInterval(delayRef.current);

    setDelayTime(15);
    setTimeLeft(0);
    setTimeUsed(0);

    delayRef.current = setInterval(() => {
      setDelayTime((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(delayRef.current!);
          setDelayTime(null);

          const duration = DIFFICULTY_TIMERS[currentQuiz.difficulty];
          setTimeLeft(duration);

          timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
              if (prev <= 1) {
                clearInterval(timerRef.current!);
                handleNext(true);
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

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (delayRef.current) clearInterval(delayRef.current);
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

      const usedTime = timeUsed;

      setScore((prev) => (isCorrect ? prev + 1 : prev));
      setUserSolutions((prev) => [
        ...prev,
        {
          question: currentQuiz.question,
          correct: currentQuiz.answer,
          userAnswer: userAnswer || "(no answer)",
          solution: currentQuiz.solution,
          isCorrect,
          timeUsed: usedTime,
        },
      ]);

      if (currentQuizIndex < quizQueue.length - 1) {
        const nextIndex = currentQuizIndex + 1;
        setCurrentQuizIndex(nextIndex);
        setCurrentQuiz(quizQueue[nextIndex]);
        setUserAnswer("");
        setTimeUsed(0);
        setDelayTime(15);

        // Scroll to top after moving to next quiz
        const ionContent = document.querySelector("ion-content");
        ionContent?.scrollToTop(300);
      } else {
        clearInterval(timerRef.current!);
        setShowResultModal(true);
        saveResult(
          score + (isCorrect ? 1 : 0),
          [...userSolutions, { question: currentQuiz.question, correct: currentQuiz.answer, userAnswer, solution: currentQuiz.solution, isCorrect, timeUsed }].reduce(
            (sum, q) => sum + q.timeUsed,
            0
          )
        );
      }
    },
    [currentQuiz, currentQuizIndex, quizQueue, userAnswer, score, timeUsed, userSolutions]
  );

  const saveResult = async (finalScore: number, totalTime: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;

      await supabase.from("scores").insert([
        {
          user_id: userId,
          quiz_id: quizQueue[0]?.id || null,
          score: finalScore,
          time_taken: Math.round(totalTime),
        },
      ]);
    } catch (err) {
      console.error("Error saving motion quiz score:", err);
    }
  };

  return (
    <IonPage className="quiz-container">
      <IonHeader>
        <IonToolbar>
          <IonTitle className="quiz-title">Uniform Motion Quiz</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <AnimatePresence>
            {!selectedCategory ? (
              <motion.div
                key="category"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="quiz-category"
              >
                <h2 className="quiz-heading">Select Category</h2>
                <div className="quiz-category-buttons">
                  {["Word Problem", "Problem Solving"].map((cat) => (
                    <IonButton key={cat} onClick={() => startQuiz(cat)} className="quiz-btn">
                      {cat}
                    </IonButton>
                  ))}
                </div>
              </motion.div>
            ) : currentQuiz ? (
              <motion.div
                key={currentQuiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="quiz-content"
              >
                {delayTime !== null ? (
                  <div className={`quiz-delay ${delayTime <= 3 ? "almost-start" : ""}`}>
                    {delayTime > 3
                      ? `📖 Reading Time: ${delayTime}s`
                      : `⚡ Get Ready! The timer will start soon: ${delayTime}s`}
                  </div>
                ) : (
                  <div className={`quiz-timer ${timeLeft <= 5 ? "critical" : ""}`}>
                    ⏳ Time Left: {timeLeft}s
                  </div>
                )}

                <h2 className="quiz-difficulty">{currentQuiz.difficulty}</h2>
                <p className="quiz-question">{currentQuiz.question}</p>

                <IonItem className="quiz-input-item">
                  <IonInput
                    value={userAnswer}
                    placeholder="Enter your answer"
                    onIonInput={(e) => setUserAnswer(e.detail.value!)}
                    className="quiz-input"
                  />
                </IonItem>

                {errorMessage && <IonText color="danger" className="quiz-error">{errorMessage}</IonText>}

                <IonButton
                  expand="block"
                  onClick={() => handleNext(false)}
                  className="quiz-next"
                >
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
                    clearInterval(delayRef.current!);

                    const ionContent = document.querySelector("ion-content");
                    ionContent?.scrollToTop(300);
                  }}
                  className="quiz-back"
                >
                  Back to Categories
                </IonButton>
              </motion.div>
            ) : (
              <p className="quiz-loading">Loading...</p>
            )}
          </AnimatePresence>
        </div>

        <IonModal isOpen={showResultModal} backdropDismiss={false}>
          <IonHeader>
            <IonToolbar>
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
                  <span className={res.isCorrect ? "text-correct" : "text-wrong"}>{res.userAnswer}</span>
                  <br />
                  <b>Correct Answer:</b> {res.correct}
                  <br />
                  <b>Solution:</b>
                  <pre>{res.solution || "No solution provided."}</pre>
                  <b>Time Used:</b> {res.timeUsed}s
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
                const ionContent = document.querySelector("ion-content");
                ionContent?.scrollToTop(0);
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

export default MotionQuiz;
