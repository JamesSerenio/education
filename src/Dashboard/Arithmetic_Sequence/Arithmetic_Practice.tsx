/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useRef, useState } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonText,
} from "@ionic/react";
import { useNavigate } from "react-router-dom"; 
import ArithmeticQuiz from "./arithmetic_quiz";

/**
 * Arithmetic_Practice.tsx
 * - Inline per-field error messages
 * - Focus sa unang invalid field
 * - Suggestions kapag computed n ay hindi integer
 * - Step by step solution + final answer in box (black border, black text)
 */

const Arithmetic_Practice: React.FC = () => {
  const history = useNavigate();
  const [category, setCategory] = useState<string>("an");
  const [a1, setA1] = useState<string>("");
  const [an, setAn] = useState<string>("");
  const [n, setN] = useState<string>("");
  const [d, setD] = useState<string>("");

  const [result, setResult] = useState<string>("");
  const [steps, setSteps] = useState<string[]>([]);

  const [showQuiz, setShowQuiz] = useState(false);

  // per-field error messages
  const [a1Error, setA1Error] = useState<string>("");
  const [anError, setAnError] = useState<string>("");
  const [nError, setNError] = useState<string>("");
  const [dError, setDError] = useState<string>("");

  // refs for focusing inputs
  const a1Ref = useRef<any>(null);
  const anRef = useRef<any>(null);
  const nRef = useRef<any>(null);
  const dRef = useRef<any>(null);

  // block keyboard keys (e/E/+/-) in numeric inputs
  const blockInvalidKeys = (e: React.KeyboardEvent) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const clearErrors = () => {
    setA1Error("");
    setAnError("");
    setNError("");
    setDError("");
  };

  const formatNumber = (v: number) =>
    Number.isInteger(v) ? v.toString() : v.toFixed(2);

  const calculate = () => {
    // reset previous messages
    clearErrors();
    setResult("");
    setSteps([]);

    // Helper: set error and focus then return true (to stop)
    const setFieldErrorAndFocus = (field: "a1" | "an" | "n" | "d", msg: string) => {
      if (field === "a1") {
        setA1Error(msg);
        (a1Ref.current as any)?.setFocus?.();
      } else if (field === "an") {
        setAnError(msg);
        (anRef.current as any)?.setFocus?.();
      } else if (field === "n") {
        setNError(msg);
        (nRef.current as any)?.setFocus?.();
      } else {
        setDError(msg);
        (dRef.current as any)?.setFocus?.();
      }
    };

    // check required fields per category
    if (category === "an") {
      if (a1.trim() === "") {
        setFieldErrorAndFocus("a1", "Required");
        setResult("⚠️ No numbers input. Please fill all required fields.");
        return;
      }
      if (n.trim() === "") {
        setFieldErrorAndFocus("n", "Required");
        setResult("⚠️ No numbers input. Please fill all required fields.");
        return;
      }
      if (d.trim() === "") {
        setFieldErrorAndFocus("d", "Required");
        setResult("⚠️ No numbers input. Please fill all required fields.");
        return;
      }
    } else if (category === "a1") {
      if (an.trim() === "") {
        setFieldErrorAndFocus("an", "Required");
        setResult("⚠️ No numbers input. Please fill all required fields.");
        return;
      }
      if (n.trim() === "") {
        setFieldErrorAndFocus("n", "Required");
        setResult("⚠️ No numbers input. Please fill all required fields.");
        return;
      }
      if (d.trim() === "") {
        setFieldErrorAndFocus("d", "Required");
        setResult("⚠️ No numbers input. Please fill all required fields.");
        return;
      }
    } else if (category === "n") {
      if (an.trim() === "") {
        setFieldErrorAndFocus("an", "Required");
        setResult("⚠️ No numbers input. Please fill all required fields.");
        return;
      }
      if (a1.trim() === "") {
        setFieldErrorAndFocus("a1", "Required");
        setResult("⚠️ No numbers input. Please fill all required fields.");
        return;
      }
      if (d.trim() === "") {
        setFieldErrorAndFocus("d", "Required");
        setResult("⚠️ No numbers input. Please fill all required fields.");
        return;
      }
    } else if (category === "d") {
      if (an.trim() === "") {
        setFieldErrorAndFocus("an", "Required");
        setResult("⚠️ No numbers input. Please fill all required fields.");
        return;
      }
      if (a1.trim() === "") {
        setFieldErrorAndFocus("a1", "Required");
        setResult("⚠️ No numbers input. Please fill all required fields.");
        return;
      }
      if (n.trim() === "") {
        setFieldErrorAndFocus("n", "Required");
        setResult("⚠️ No numbers input. Please fill all required fields.");
        return;
      }
    }

    // parse values
    const A1 = parseFloat(a1);
    const AN = parseFloat(an);
    const N = parseInt(n);
    const D = parseFloat(d);

    // basic parse validation
    const parseProblems: Array<{ field: string; value: any }> = [];
    if (category !== "a1" && (isNaN(A1) || a1.trim() === "")) parseProblems.push({ field: "a1", value: a1 });
    if (category !== "an" && (isNaN(AN) || an.trim() === "")) parseProblems.push({ field: "an", value: an });
    if (category !== "n" && (isNaN(N) || n.trim() === "")) parseProblems.push({ field: "n", value: n });
    if (category !== "d" && (isNaN(D) || d.trim() === "")) parseProblems.push({ field: "d", value: d });

    if (parseProblems.length > 0) {
      // mark each field that failed parsing
      for (const p of parseProblems) {
        if (p.field === "a1") setA1Error("Invalid number");
        if (p.field === "an") setAnError("Invalid number");
        if (p.field === "n") setNError("Invalid integer");
        if (p.field === "d") setDError("Invalid number");
      }
      // focus first parseProblem
      const first = parseProblems[0].field as "a1" | "an" | "n" | "d";
      setFieldErrorAndFocus(first, first === "n" ? "Invalid integer" : "Invalid number");
      setResult("⚠️ That number is not valid for this formula.");
      return;
    }

    // now perform category-specific computations + validations
    try {
      const newSteps: string[] = [];

      if (category === "an") {
        if (!Number.isInteger(N) || N <= 0) {
          setFieldErrorAndFocus("n", "n must be a positive integer");
          setResult("⚠️ That number is not valid for this formula.");
          return;
        }
        const computed = A1 + (N - 1) * D;
        newSteps.push(`Formula: a${N} = a₁ + (n - 1) × d`);
        newSteps.push(`Substitute: a${N} = ${formatNumber(A1)} + (${N} - 1) × ${formatNumber(D)}`);
        newSteps.push(`Compute (n - 1) × d = ${(N - 1)} × ${formatNumber(D)} = ${formatNumber((N - 1) * D)}`);
        newSteps.push(`Add: a${N} = ${formatNumber(A1)} + ${formatNumber((N - 1) * D)} = ${formatNumber(computed)}`);
        setSteps(newSteps);
        setResult(`a${N} = ${formatNumber(computed)}`);
      } else if (category === "a1") {
        if (!Number.isInteger(N) || N <= 0) {
          setFieldErrorAndFocus("n", "n must be a positive integer");
          setResult("⚠️ That number is not valid for this formula.");
          return;
        }
        const computed = AN - (N - 1) * D;
        newSteps.push(`Formula: a₁ = aₙ − (n − 1) × d`);
        newSteps.push(`Substitute: a₁ = ${formatNumber(AN)} − (${N} - 1) × ${formatNumber(D)}`);
        newSteps.push(`Compute (n − 1) × d = ${(N - 1)} × ${formatNumber(D)} = ${formatNumber((N - 1) * D)}`);
        newSteps.push(`Subtract: a₁ = ${formatNumber(AN)} − ${formatNumber((N - 1) * D)} = ${formatNumber(computed)}`);
        setSteps(newSteps);
        setResult(`a₁ = ${formatNumber(computed)}`);
      } else if (category === "n") {
        if (D === 0) {
          setFieldErrorAndFocus("d", "d cannot be zero");
          setResult("⚠️ That number is not valid for this formula.");
          return;
        }

        // compute nVal (may be non-integer)
        const nVal = (AN - A1) / D + 1;
        if (!Number.isFinite(nVal)) {
          setResult("⚠️ That number is not valid for this formula.");
          setNError("Invalid result");
          (nRef.current as any)?.setFocus?.();
          return;
        }

        // if nVal not integer, suggest adjustments (show next to a1/an/d)
        if (!Number.isInteger(nVal) || nVal <= 0) {
          // compute nearest integer k for (AN - A1)/D
          const kFloat = (AN - A1) / D;
          const kRound = Math.round(kFloat); // nearest integer multiple
          // suggestion for a1: desired a1 = AN - kRound * D
          const desiredA1 = AN - kRound * D;
          const deltaA1 = desiredA1 - A1;
          // suggestion for an: desired an = A1 + kRound * D
          const desiredAN = A1 + kRound * D;
          const deltaAN = desiredAN - AN;
          // suggestion for d: desired d = (AN - A1) / kRound (if kRound != 0)
          let deltaD = NaN;
          if (kRound !== 0) {
            const desiredD = (AN - A1) / kRound;
            deltaD = desiredD - D;
          }

          // build suggestion strings
          const sugA1 =
            Math.abs(deltaA1) < 0.0001
              ? "no change suggested for a₁"
              : `${deltaA1 < 0 ? "decrease" : "increase"} a₁ by ${formatNumber(Math.abs(
                  deltaA1
                ))}`;
          const sugAN =
            Math.abs(deltaAN) < 0.0001
              ? "no change suggested for aₙ"
              : `${deltaAN < 0 ? "decrease" : "increase"} aₙ by ${formatNumber(Math.abs(
                  deltaAN
                ))}`;
          const sugD =
            isNaN(deltaD) || !isFinite(deltaD)
              ? "no suggestion for d"
              : `${deltaD < 0 ? "decrease" : "increase"} d by ${formatNumber(Math.abs(deltaD))}`;

          // Set field errors/suggestions (user wanted suggestion near a1/an depending)
          setNError(`Computed n = ${formatNumber(nVal)} (not an integer).`);
          // show suggestions near a1 and an and d
          setA1Error(`To make n integer: ${sugA1}`);
          setAnError(`Or: ${sugAN}`);
          setDError(`Or: ${sugD}`);

          // focus first field with suggestion (a1)
          (a1Ref.current as any)?.setFocus?.();
          setResult("⚠️ That number is not valid for this formula.");
          return;
        }

        // OK nVal integer -> produce steps
        const nInt = Math.round(nVal);
        newSteps.push("Formula: n = (aₙ − a₁) / d + 1");
        newSteps.push(`Substitute: n = (${formatNumber(AN)} − ${formatNumber(A1)}) / ${formatNumber(D)} + 1`);
        newSteps.push(`Compute: (${formatNumber(AN)} − ${formatNumber(A1)}) / ${formatNumber(D)} = ${formatNumber((AN - A1) / D)}`);
        newSteps.push(`Add 1: n = ${formatNumber((AN - A1) / D)} + 1 = ${nInt}`);
        setSteps(newSteps);
        setResult(`n = ${nInt}`);
      } else if (category === "d") {
        if (!Number.isInteger(N) || N <= 1) {
          setFieldErrorAndFocus("n", "n must be an integer > 1");
          setResult("⚠️ That number is not valid for this formula.");
          return;
        }
        const computed = (AN - A1) / (N - 1);
        if (!isFinite(computed)) {
          setFieldErrorAndFocus("d", "Invalid");
          setResult("⚠️ That number is not valid for this formula.");
          return;
        }
        newSteps.push("Formula: d = (aₙ − a₁) / (n − 1)");
        newSteps.push(`Substitute: d = (${formatNumber(AN)} − ${formatNumber(A1)}) / (${N} - 1)`);
        newSteps.push(`Compute: (${formatNumber(AN)} − ${formatNumber(A1)}) / (${N} - 1) = ${formatNumber(computed)}`);
        setSteps(newSteps);
        setResult(`d = ${formatNumber(computed)}`);
      }
    } catch (err) {
      setResult("⚠️ That number is not valid for this formula.");
    }
  };

  const resetAll = () => {
    setA1("");
    setAn("");
    setN("");
    setD("");
    setResult("");
    setSteps([]);
    clearErrors();
  };

    if (showQuiz) {
    return <ArithmeticQuiz />;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Let's Practice First</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* Select Category */}
        <IonItem>
          <IonLabel>Choose Category</IonLabel>
          <IonSelect
            value={category}
            onIonChange={(e) => {
              setCategory(e.detail.value);
              setResult("");
              setSteps([]);
              clearErrors();
            }}
          >
            <IonSelectOption value="an">Find aₙ</IonSelectOption>
            <IonSelectOption value="a1">Find a₁</IonSelectOption>
            <IonSelectOption value="n">Find n</IonSelectOption>
            <IonSelectOption value="d">Find d</IonSelectOption>
          </IonSelect>
        </IonItem>

        {/* Inputs */}
        {category !== "a1" && (
          <IonItem lines="none" style={{ marginTop: 8 }}>
            <div style={{ width: "100%" }}>
              <IonLabel position="stacked">a₁</IonLabel>
              <IonInput
                ref={a1Ref}
                type="number"
                inputMode="decimal"
                value={a1}
                onIonChange={(e) => setA1(e.detail.value ?? "")}
                onKeyDown={blockInvalidKeys}
                style={{ width: "100%" }}
              />
              {a1Error && (
                <IonText color="danger" style={{ fontSize: 12 }}>
                  {a1Error}
                </IonText>
              )}
            </div>
          </IonItem>
        )}

        {category !== "an" && (
          <IonItem lines="none" style={{ marginTop: 8 }}>
            <div style={{ width: "100%" }}>
              <IonLabel position="stacked">aₙ</IonLabel>
              <IonInput
                ref={anRef}
                type="number"
                inputMode="decimal"
                value={an}
                onIonChange={(e) => setAn(e.detail.value ?? "")}
                onKeyDown={blockInvalidKeys}
                style={{ width: "100%" }}
              />
              {anError && (
                <IonText color="danger" style={{ fontSize: 12 }}>
                  {anError}
                </IonText>
              )}
            </div>
          </IonItem>
        )}

        {category !== "n" && (
          <IonItem lines="none" style={{ marginTop: 8 }}>
            <div style={{ width: "100%" }}>
              <IonLabel position="stacked">n</IonLabel>
              <IonInput
                ref={nRef}
                type="number"
                inputMode="numeric"
                value={n}
                onIonChange={(e) => setN(e.detail.value ?? "")}
                onKeyDown={blockInvalidKeys}
                style={{ width: "100%" }}
              />
              {nError && (
                <IonText color="danger" style={{ fontSize: 12 }}>
                  {nError}
                </IonText>
              )}
            </div>
          </IonItem>
        )}

        {category !== "d" && (
          <IonItem lines="none" style={{ marginTop: 8 }}>
            <div style={{ width: "100%" }}>
              <IonLabel position="stacked">d</IonLabel>
              <IonInput
                ref={dRef}
                type="number"
                inputMode="decimal"
                value={d}
                onIonChange={(e) => setD(e.detail.value ?? "")}
                onKeyDown={blockInvalidKeys}
                style={{ width: "100%" }}
              />
              {dError && (
                <IonText color="danger" style={{ fontSize: 12 }}>
                  {dError}
                </IonText>
              )}
            </div>
          </IonItem>
        )}

        {/* Buttons (centered) */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 20 }}>
          <IonButton color="primary" onClick={calculate}>
            Solve
          </IonButton>
          <IonButton color="medium" onClick={resetAll}>
            Reset
          </IonButton>
          <IonButton
            color="success"
            onClick={() => setShowQuiz(true)} // 👉 switch to quiz
          >
            Proceed to Quiz
          </IonButton>
        </div>

        {/* Step-by-step */}
        {steps.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3>Solution:</h3>
            <ol>
              {steps.map((s, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  <IonText color="dark">{s}</IonText>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Final Answer box (black border, black text inside) */}
        {result && (
          <div
            style={{
              marginTop: 18,
              padding: 14,
              border: "2px solid #000",
              borderRadius: 8,
              backgroundColor: "#fff",
              maxWidth: 600,
              marginLeft: "auto",
              marginRight: "auto",
              textAlign: "center",
            }}
          >
            <IonText color="dark">
              <strong style={{ fontSize: 18 }}>{result}</strong>
            </IonText>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Arithmetic_Practice;
