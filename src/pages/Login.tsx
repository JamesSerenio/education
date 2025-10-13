import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
} from "@ionic/react";
import {
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
} from "ionicons/icons";
import { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../utils/supabaseClient";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        setErrorMsg("Invalid email or password");
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, firstname, lastname, role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError || !profile) {
        setErrorMsg("Profile not found. Please contact admin.");
        setLoading(false);
        return;
      }

      localStorage.setItem("profile_id", profile.id || "");
      localStorage.setItem("firstname", profile.firstname || "");
      localStorage.setItem("lastname", profile.lastname || "");
      localStorage.setItem("role", profile.role || "user");

      setLoading(false);
      history.push(
        profile.role === "admin"
          ? "/education/admin/admin_dashboard"
          : "/education/home"
      );
    } catch (err) {
      console.error("Unexpected login error:", err);
      setErrorMsg("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  // ✨ Floating math + motion symbols
  const mathSymbols = [
    "+", "-", "×", "÷", "=", "%", "√", "π", "Σ",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "distance", "velocity", "displacement", "speed",
    "a₁", "d", "n", "aₙ",
  ];

  return (
    <IonPage>
      <IonContent className="auth-bg" fullscreen>
        {/* Floating math symbols */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          {mathSymbols.map((symbol, index) => (
            <motion.div
              key={index}
              className="floating-symbol"
              animate={{
                y: [0, Math.random() * 40 - 20, 0],
                x: [0, Math.random() * 20 - 10, 0],
                rotate: [0, Math.random() * 30 - 15, 0],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "easeInOut",
              }}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 1.5 + 0.8}rem`,
                color: "rgba(255, 255, 255, 0.25)",
                position: "absolute",
                userSelect: "none",
              }}
            >
              {symbol}
            </motion.div>
          ))}
        </div>

        {/* Login Card */}
        <div className="auth-container">
          <motion.div
            className="auth-card"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ zIndex: 2 }}
          >
            <motion.h2
              className="auth-title"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              🔢 Login
            </motion.h2>

            <form className="auth-form" onSubmit={handleSubmit}>
              {/* Email */}
              <motion.div
                className="auth-input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <IonIcon icon={mailOutline} />
                <IonInput
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onIonChange={(e) => setEmail(e.detail.value || "")}
                  required
                />
              </motion.div>

              {/* Password with always-visible eye icon */}
              <motion.div
                className="auth-input password-input"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <IonIcon icon={lockClosedOutline} />
                <IonInput
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onIonChange={(e) => setPassword(e.detail.value || "")}
                  required
                />
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <IonIcon
                    icon={showPassword ? eyeOffOutline : eyeOutline}
                  />
                </button>
              </motion.div>

              {errorMsg && <p className="auth-error">{errorMsg}</p>}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <IonButton
                  expand="block"
                  type="submit"
                  className="auth-button"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Let’s Go! 🚀"}
                </IonButton>
              </motion.div>
            </form>

            <motion.p
              className="auth-footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Don’t have an account?{" "}
              <Link to="/education/register" className="auth-link">
                Register here ➕
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
