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
        {/* 🔘 Light/Dark mode toggle */}
        <div className="mode-toggle" onClick={() => setDarkMode(!darkMode)}>
          <IonIcon
            icon={darkMode ? sunnyOutline : moonOutline}
            className="mode-icon"
          />
        </div>

        <div className="login-wrapper">
          <div className="login-card">
            <h2 className="login-title">LOGIN</h2>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-input">
                <IonIcon icon={mailOutline} />
                <IonInput
                  type="email"
                  placeholder="Email"
                  value={email}
                  onIonChange={(e) => setEmail(e.detail.value!)}
                  required
                />
              </div>

              <div className="login-input">
                <IonIcon icon={lockClosedOutline} />
                <IonInput
                  type="password"
                  placeholder="Password"
                  value={password}
                  onIonChange={(e) => setPassword(e.detail.value!)}
                  required
                />
              </div>

              {errorMsg && (
                <p style={{ color: "red", marginBottom: "1rem" }}>{errorMsg}</p>
              )}

              <IonButton expand="block" type="submit" className="login-button">
                Login
              </IonButton>
            </form>

            <p className="login-register">
              Don’t have an account?{" "}
              <Link
                to="/education/register"
                className="text-blue-600 font-medium"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
