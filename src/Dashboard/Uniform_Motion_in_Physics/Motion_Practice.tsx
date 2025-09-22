import React, { useState } from "react";
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
import { useHistory } from "react-router-dom"; 

const Motion_Practice: React.FC = () => {
    const history = useHistory();
  const [category, setCategory] = useState<string>("v");
  const [v, setV] = useState<string>("");
  const [s, setS] = useState<string>(""); // displacement
  const [t, setT] = useState<string>(""); // time

  const [result, setResult] = useState<string>("");
  const [steps, setSteps] = useState<string[]>([]);

  const blockInvalidKeys = (e: React.KeyboardEvent) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const formatNumber = (n: number) =>
    Number.isInteger(n) ? n.toString() : n.toFixed(2);

  const calculate = () => {
    // clear previous
    setSteps([]);
    setResult("");

    const inputsMissing = () => {
      switch (category) {
        case "v":
          return s.trim() === "" || t.trim() === "";
        case "s":
          return v.trim() === "" || t.trim() === "";
        case "t":
          return v.trim() === "" || s.trim() === "";
        default:
          return true;
      }
    };

    if (inputsMissing()) {
      setResult("⚠️ Please fill all required fields.");
      return;
    }

    try {
      const V = parseFloat(v);
      const S = parseFloat(s);
      const T = parseFloat(t);

      // validate parsed numbers
      if (category === "v") {
        if (isNaN(S) || isNaN(T)) throw new Error("Invalid inputs");
        if (T === 0) {
          setResult("⚠️ Time (t) cannot be zero.");
          return;
        }
      } else if (category === "s") {
        if (isNaN(V) || isNaN(T)) throw new Error("Invalid inputs");
      } else if (category === "t") {
        if (isNaN(V) || isNaN(S)) throw new Error("Invalid inputs");
        if (V === 0) {
          setResult("⚠️ Velocity (v) cannot be zero.");
          return;
        }
      }

      const newSteps: string[] = [];
      let answer = "";

      switch (category) {
        case "v": {
          const computed = S / T;
          newSteps.push(`Given: s = ${formatNumber(S)} m, t = ${formatNumber(T)} s`);
          newSteps.push("Formula: v = s / t");
          newSteps.push(`Substitute: v = ${formatNumber(S)} / ${formatNumber(T)}`);
          newSteps.push(`Compute: v = ${formatNumber(computed)} m/s`);
          answer = `v = ${formatNumber(computed)} m/s`;
          break;
        }

        case "s": {
          const computed = V * T;
          newSteps.push(`Given: v = ${formatNumber(V)} m/s, t = ${formatNumber(T)} s`);
          newSteps.push("Formula: s = v × t");
          newSteps.push(`Substitute: s = ${formatNumber(V)} × ${formatNumber(T)}`);
          newSteps.push(`Compute: s = ${formatNumber(computed)} m`);
          answer = `s = ${formatNumber(computed)} m`;
          break;
        }

        case "t": {
          const computed = S / V;
          newSteps.push(`Given: s = ${formatNumber(S)} m, v = ${formatNumber(V)} m/s`);
          newSteps.push("Formula: t = s / v");
          newSteps.push(`Substitute: t = ${formatNumber(S)} / ${formatNumber(V)}`);
          newSteps.push(`Compute: t = ${formatNumber(computed)} s`);
          answer = `t = ${formatNumber(computed)} s`;
          break;
        }

        default:
          throw new Error("Invalid category");
      }

      setSteps(newSteps);
      setResult(answer);
    } catch {
      setResult("⚠️ Invalid number for this formula.");
    }
  };

  const resetAll = () => {
    setV("");
    setS("");
    setT("");
    setResult("");
    setSteps([]);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Uniform Motion Practice</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel>Choose Category</IonLabel>
          <IonSelect
            value={category}
            onIonChange={(e) => {
              setCategory(e.detail.value);
              setResult("");
              setSteps([]);
            }}
          >
            <IonSelectOption value="v">Find v (velocity)</IonSelectOption>
            <IonSelectOption value="s">Find s (displacement)</IonSelectOption>
            <IonSelectOption value="t">Find t (time)</IonSelectOption>
          </IonSelect>
        </IonItem>

        {/* Inputs */}
        {category !== "v" && (
          <IonItem>
            <IonLabel position="stacked">v (m/s)</IonLabel>
            <IonInput
              type="number"
              inputMode="decimal"
              value={v}
              onKeyDown={blockInvalidKeys}
              onIonChange={(e) => setV(e.detail.value ?? "")}
            />
          </IonItem>
        )}
        {category !== "s" && (
          <IonItem>
            <IonLabel position="stacked">s (m)</IonLabel>
            <IonInput
              type="number"
              inputMode="decimal"
              value={s}
              onKeyDown={blockInvalidKeys}
              onIonChange={(e) => setS(e.detail.value ?? "")}
            />
          </IonItem>
        )}
        {category !== "t" && (
          <IonItem>
            <IonLabel position="stacked">t (s)</IonLabel>
            <IonInput
              type="number"
              inputMode="decimal"
              value={t}
              onKeyDown={blockInvalidKeys}
              onIonChange={(e) => setT(e.detail.value ?? "")}
            />
          </IonItem>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
          <IonButton color="primary" onClick={calculate}>
            Solve
          </IonButton>
          <IonButton color="medium" onClick={resetAll}>
            Reset
          </IonButton>
          <IonButton
         color="success"
          onClick={() => history.push("/education/Motion_quiz")}
          >
           Proceed to Quiz
            </IonButton>
        </div>

        {/* Step-by-step */}
        {steps.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3>Solution:</h3>
            <ol>
              {steps.map((sItem, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  <IonText color="dark">{sItem}</IonText>
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

        {/* Fallback inline result (keeps compatibility if you rely on it) */}
        {!result && steps.length === 0 && (
          <div style={{ marginTop: 18 }}>
            <IonText color="medium">
              <small>Fill inputs and press Solve to see step-by-step solution.</small>
            </IonText>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Motion_Practice;
