import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonCheckbox,
  IonIcon,
  IonText,
  IonAlert,
} from "@ionic/react";
import { useState } from "react";
import { useHistory, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { personOutline, mailOutline, lockClosedOutline } from "ionicons/icons";
import { supabase } from "../utils/supabaseClient";

const Register: React.FC = () => {
  const history = useHistory();

  const [lastname, setLastname] = useState("");
  const [firstname, setFirstname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const sanitizeInput = (text: string) => {
    if (!text) return "";
    const normalized = text.normalize("NFC").trim();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanLastname = sanitizeInput(lastname);
    const cleanFirstname = sanitizeInput(firstname);

    if (!cleanLastname || !cleanFirstname || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setError("You must agree to the terms and conditions.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
      });

      if (signUpError) throw signUpError;
      const user = data.user;

      if (!user) {
        setShowAlert(true);
        setLoading(false);
        return;
      }

      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: user.id,
          firstname: cleanFirstname,
          lastname: cleanLastname,
          email: email.toLowerCase(),
          role: "user",
          created_at: new Date(),
        },
      ]);

      if (profileError) throw profileError;

      setShowAlert(true);
    } catch (err) {
      console.error("Registration error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const symbols = [
    "+", "-", "×", "÷", "=", "%", "√", "π", "Σ",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "distance", "velocity", "displacement", "speed",
    "a₁", "d", "n", "aₙ",
  ];

  return (
    <IonPage>
      <IonContent className="auth-bg" fullscreen style={{ overflow: "hidden", position: "relative" }}>
        {/* ✨ Floating Math + Motion symbols that appear/disappear without causing scroll */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          {symbols.map((symbol, index) => (
            <motion.div
              key={index}
              className="floating-symbol"
              initial={{
                opacity: 0,
                scale: 0.8,
                x: Math.random() * window.innerWidth - window.innerWidth / 2,
                y: Math.random() * window.innerHeight - window.innerHeight / 2,
              }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: [Math.random() * 50 - 25, Math.random() * 50 - 25],
                y: [Math.random() * 50 - 25, Math.random() * 50 - 25],
                rotate: [0, Math.random() * 45 - 20, 0],
                scale: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeInOut",
              }}
              style={{
                position: "absolute",
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                transform: "translate(-50%, -50%)",
                fontSize: `${Math.random() * 1.5 + 0.8}rem`,
                color: "rgba(255, 255, 255, 0.25)",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {symbol}
            </motion.div>
          ))}
        </div>
        {/* Register Card */}
        <motion.div
          className="auth-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="auth-card"
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.h2
              className="auth-title"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              🧮 Register
            </motion.h2>

            <motion.form
              className="auth-form"
              onSubmit={handleRegister}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <motion.div
                style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <div className="auth-input" style={{ flex: 1 }}>
                  <IonIcon icon={personOutline} />
                  <IonInput
                    type="text"
                    placeholder="Lastname"
                    value={lastname}
                    onIonChange={(e) => setLastname(e.detail.value ?? "")}
                    required
                  />
                </div>
                <div className="auth-input" style={{ flex: 1 }}>
                  <IonIcon icon={personOutline} />
                  <IonInput
                    type="text"
                    placeholder="Firstname"
                    value={firstname}
                    onIonChange={(e) => setFirstname(e.detail.value ?? "")}
                    required
                  />
                </div>
              </motion.div>

              <motion.div
                className="auth-input"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <IonIcon icon={mailOutline} />
                <IonInput
                  type="email"
                  placeholder="Email"
                  value={email}
                  onIonChange={(e) => setEmail(e.detail.value ?? "")}
                  required
                />
              </motion.div>

              <motion.div
                className="auth-input"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <IonIcon icon={lockClosedOutline} />
                <IonInput
                  type="password"
                  placeholder="Password"
                  value={password}
                  onIonChange={(e) => setPassword(e.detail.value ?? "")}
                  required
                />
              </motion.div>

              <motion.div
                className="auth-input"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <IonIcon icon={lockClosedOutline} />
                <IonInput
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onIonChange={(e) => setConfirmPassword(e.detail.value ?? "")}
                  required
                />
              </motion.div>

              <motion.div
                style={{ display: "flex", alignItems: "center", marginTop: "0.5rem" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <IonCheckbox
                  checked={agreeTerms}
                  onIonChange={(e) => setAgreeTerms(e.detail.checked)}
                  id="terms-checkbox"
                />
                <label htmlFor="terms-checkbox" className="auth-terms">
                  I agree to the terms and conditions
                </label>
              </motion.div>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                  <IonText color="danger" className="auth-error">
                    {error}
                  </IonText>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.5 }}
              >
                <IonButton
                  expand="block"
                  type="submit"
                  className="auth-button"
                  disabled={!agreeTerms || loading}
                >
                  {loading ? "Registering..." : "Register"}
                </IonButton>
              </motion.div>
            </motion.form>

            <motion.p
              className="auth-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >
              Already have an account?{" "}
              <Link to="/education/login" className="auth-link">
                Login here 🚀
              </Link>
            </motion.p>
          </motion.div>
        </motion.div>

        <IonAlert
          isOpen={showAlert}
          header="Confirm Your Email"
          message="Registration successful! Please check your email to confirm your account."
          buttons={[
            {
              text: "OK",
              handler: () => {
                setShowAlert(false);
                history.push("/education/login");
              },
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Register;
