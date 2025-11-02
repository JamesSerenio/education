import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonCheckbox,
  IonIcon,
  IonText,
  IonAlert,
  IonModal,
} from "@ionic/react";
import { useState } from "react";
import { useHistory, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  personOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  informationCircleOutline,
} from "ionicons/icons";
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
  const [showTermsModal, setShowTermsModal] = useState(false); // ⚡ for terms popup

  // 👁️ show/hide toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      // 🔹 Check if email already exists
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", email.toLowerCase())
        .single();

      if (existingUser) {
        setError("You are already registered! Please login instead.");
        setLoading(false);
        return;
      }

      // 🔹 Register new user
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

      // 🔹 Insert profile
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

      // ✅ Show success alert
      setShowAlert(true);
    } catch (err) {
      console.error("Registration error:", err);
      if (err instanceof Error) setError(err.message);
      else setError("An unexpected error occurred.");
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
        {/* ✨ Floating Math Symbols */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 1, pointerEvents: "none" }}>
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
        <motion.div className="auth-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
          <motion.div className="auth-card register-card" initial={{ scale: 0.9, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }}>
            <motion.h2 className="auth-title" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
              🧮 Register
            </motion.h2>

            <form className="auth-form" onSubmit={handleRegister}>
              {/* Name Fields */}
              <motion.div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
                <div className="auth-input" style={{ flex: 1 }}>
                  <IonIcon icon={personOutline} />
                  <IonInput type="text" placeholder="Lastname" value={lastname} onIonChange={(e) => setLastname(e.detail.value ?? "")} required />
                </div>
                <div className="auth-input" style={{ flex: 1 }}>
                  <IonIcon icon={personOutline} />
                  <IonInput type="text" placeholder="Firstname" value={firstname} onIonChange={(e) => setFirstname(e.detail.value ?? "")} required />
                </div>
              </motion.div>

              {/* Email */}
              <motion.div className="auth-input" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
                <IonIcon icon={mailOutline} />
                <IonInput type="email" placeholder="Email" value={email} onIonChange={(e) => setEmail(e.detail.value ?? "")} required />
              </motion.div>

              {/* Password */}
              <motion.div className="auth-input" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7, duration: 0.5 }} style={{ position: "relative" }}>
                <IonIcon icon={lockClosedOutline} />
                <IonInput type={showPassword ? "text" : "password"} placeholder="Password" value={password} onIonChange={(e) => setPassword(e.detail.value ?? "")} required />
                <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} onClick={() => setShowPassword(!showPassword)} className="password-toggle" />
              </motion.div>

              {/* Confirm Password */}
              <motion.div className="auth-input" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8, duration: 0.5 }} style={{ position: "relative" }}>
                <IonIcon icon={lockClosedOutline} />
                <IonInput type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onIonChange={(e) => setConfirmPassword(e.detail.value ?? "")} required />
                <IonIcon icon={showConfirmPassword ? eyeOffOutline : eyeOutline} onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="password-toggle" />
              </motion.div>

              {/* Terms */}
              <motion.div style={{ display: "flex", alignItems: "center", marginTop: "0.5rem" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
                <IonCheckbox checked={agreeTerms} onIonChange={(e) => setAgreeTerms(e.detail.checked)} id="terms-checkbox" />
                <label htmlFor="terms-checkbox" className="auth-terms">
                  I agree to the{" "}
                  <span
                    onClick={() => setShowTermsModal(true)}
                    style={{ color: "#4dabf7", cursor: "pointer", textDecoration: "underline" }}
                  >
                    terms and conditions
                  </span>
                </label>
              </motion.div>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                  <IonText color="danger" className="auth-error">
                    {error}
                  </IonText>
                </motion.div>
              )}

              {/* Register Button */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.5 }}>
                <IonButton expand="block" type="submit" className="auth-button" disabled={!agreeTerms || loading}>
                  {loading ? "Registering..." : "Register"}
                </IonButton>
              </motion.div>
            </form>

            <motion.p className="auth-footer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}>
              Already have an account? <Link to="/login" className="auth-link">Login here 🚀</Link>
            </motion.p>
          </motion.div>
        </motion.div>

        {/* ✅ Email Confirmation Alert */}
        <IonAlert
          isOpen={showAlert}
          header="Confirm Your Email"
          message="Registration successful! Please check your email to confirm your account."
          buttons={[
            {
              text: "OK",
              handler: () => {
                setShowAlert(false);
                history.push("/login");
              },
            },
          ]}
        />

          {/* 🧾 Terms Modal */}
          <IonModal
            isOpen={showTermsModal}
            onDidDismiss={() => setShowTermsModal(false)}
            className="terms-modal"
          >
            <div
              style={{
                padding: "1.2rem",
                textAlign: "left",
                maxHeight: "80vh",
                overflowY: "auto",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <IonIcon
                  icon={informationCircleOutline}
                  style={{ fontSize: "2rem", color: "#4dabf7" }}
                />
                <h3 style={{ marginTop: "0.5rem", fontWeight: "600" }}>
                  Terms and Conditions
                </h3>
              </div>

              <p style={{ fontSize: "0.8rem", marginTop: "1rem", color: "#333", lineHeight: "1.5" }}>
                By registering and using this application, you agree to comply with all terms stated below and applicable Philippine laws.
              </p>

              <h4 style={{ fontSize: "0.9rem", color: "#32CD32", marginTop: "1rem" }}>1. Proper Use</h4>
              <p style={{ fontSize: "0.75rem", color: "#444" }}>
                You agree to use this platform solely for educational and academic purposes. 
                Any attempt to exploit, damage, or disrupt the system (e.g., hacking, data manipulation, or spreading malicious software) 
                is strictly prohibited and may result in account suspension or legal action.
              </p>

              <h4 style={{ fontSize: "0.9rem", color: "#32CD32", marginTop: "1rem" }}>2. Account Responsibility</h4>
              <p style={{ fontSize: "0.75rem", color: "#444" }}>
                You are responsible for maintaining the confidentiality of your username and password. 
                Unauthorized access or impersonation of another user’s account is a violation of these terms 
                and may be subject to sanctions under the <b>Cybercrime Prevention Act of 2012 (RA 10175)</b>.
              </p>

              <h4 style={{ fontSize: "0.9rem", color: "#32CD32", marginTop: "1rem" }}>3. Data Privacy and Protection</h4>
              <p style={{ fontSize: "0.75rem", color: "#444" }}>
                Your personal data will be collected, stored, and processed in accordance with the 
                <b> Data Privacy Act of 2012 (RA 10173)</b>. Information gathered will only be used for legitimate educational purposes. 
                The system implements security measures to protect your data from unauthorized access or disclosure. 
                You may request to access, correct, or delete your personal information by contacting the system administrator.
              </p>

              <h4 style={{ fontSize: "0.9rem", color: "#32CD32", marginTop: "1rem" }}>4. Intellectual Property</h4>
              <p style={{ fontSize: "0.75rem", color: "#444" }}>
                All contents in this platform (including lessons, quizzes, and designs) are protected under the 
                <b> Intellectual Property Code of the Philippines (RA 8293)</b>. 
                Reproduction, redistribution, or modification of any materials without permission is strictly prohibited.
              </p>

              <h4 style={{ fontSize: "0.9rem", color: "#32CD32", marginTop: "1rem" }}>5. User Conduct</h4>
              <p style={{ fontSize: "0.75rem", color: "#444" }}>
                You must engage respectfully and avoid posting or sharing any offensive, discriminatory, or harmful content. 
                Violations may lead to disciplinary action or suspension from the platform.
              </p>

              <h4 style={{ fontSize: "0.9rem", color: "#32CD32", marginTop: "1rem" }}>6. Monitoring and Security</h4>
              <p style={{ fontSize: "0.75rem", color: "#444" }}>
                The system may collect activity logs (login history, progress, and usage patterns) for monitoring, improvement, and security auditing. 
                Any detected malicious or unauthorized actions will be reported and may be subject to penalties under RA 10175 (Cybercrime Law).
              </p>

              <h4 style={{ fontSize: "0.9rem", color: "#32CD32", marginTop: "1rem" }}>7. Updates to Terms</h4>
              <p style={{ fontSize: "0.75rem", color: "#444" }}>
                These Terms and Conditions may be revised periodically to reflect changes in policies or laws. 
                Continued use of the platform after updates implies your acceptance of the revised terms.
              </p>

              <h4 style={{ fontSize: "0.9rem", color: "#32CD32", marginTop: "1rem" }}>8. Consent</h4>
              <p style={{ fontSize: "0.75rem", color: "#444" }}>
                By clicking “Register” or continuing to use the platform, you signify that you have read, understood, 
                and agreed to these Terms and Conditions, including the application of the 
                <b> Data Privacy Act of 2012</b> and the <b>Cybercrime Prevention Act of 2012</b>.
              </p>

              <IonButton
                expand="block"
                onClick={() => setShowTermsModal(false)}
                style={{
                  marginTop: "1rem",
                  "--background": "#90EE90",
                  color: "#000",
                  borderRadius: "1rem",
                  fontSize: "0.9rem",
                  boxShadow: "0 0 8px rgba(144,238,144,0.4)",
                }}
              >
                OK
              </IonButton>
            </div>
          </IonModal>

      </IonContent>
    </IonPage>
  );
};

export default Register;
