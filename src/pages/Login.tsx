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
  moonOutline,
  sunnyOutline,
} from "ionicons/icons";
import { useState, useEffect } from "react";
import { Link, useHistory } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../utils/supabaseClient";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const history = useHistory();

  // Apply dark mode class to body
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg("Invalid email or password");
        return;
      }

      if (!data.user) {
        setErrorMsg("No user found");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, firstname, lastname, role")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        setErrorMsg("Profile not found. Contact admin.");
        return;
      }

      localStorage.setItem("profile_id", profile.id);
      localStorage.setItem("firstname", profile.firstname || "");
      localStorage.setItem("lastname", profile.lastname || "");
      localStorage.setItem("role", profile.role || "user");

      if (profile.role === "admin") {
        history.push("/education/admin/admin_dashboard");
      } else {
        history.push("/education/home");
      }
    } catch (error) {
      console.error("Unexpected login error:", error);
      setErrorMsg("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <IonPage>
      <IonContent className="login-content" fullscreen>
        {/* 🌙 Light/Dark Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mode-toggle"
          onClick={() => setDarkMode(!darkMode)}
        >
          <IonIcon
            icon={darkMode ? sunnyOutline : moonOutline}
            className="mode-icon cursor-pointer text-2xl"
          />
        </motion.div>

        <div className="login-wrapper">
          <motion.div
            className="login-card"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.h2
              className="login-title"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              LOGIN
            </motion.h2>

            <form className="login-form" onSubmit={handleSubmit}>
              <motion.div
                className="login-input"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <IonIcon icon={mailOutline} />
                <IonInput
                  type="email"
                  placeholder="Email"
                  value={email}
                  onIonChange={(e) => setEmail(e.detail.value!)}
                  required
                />
              </motion.div>

              <motion.div
                className="login-input"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <IonIcon icon={lockClosedOutline} />
                <IonInput
                  type="password"
                  placeholder="Password"
                  value={password}
                  onIonChange={(e) => setPassword(e.detail.value!)}
                  required
                />
              </motion.div>

              {errorMsg && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  style={{ color: "red", marginBottom: "1rem" }}
                >
                  {errorMsg}
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <IonButton expand="block" type="submit" className="login-button">
                  Login
                </IonButton>
              </motion.div>
            </form>

            <motion.p
              className="login-register"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Don’t have an account?{" "}
              <Link
                to="/education/register"
                className="text-blue-600 font-medium"
              >
                Register
              </Link>
            </motion.p>
          </motion.div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
