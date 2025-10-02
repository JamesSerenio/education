import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
} from "@ionic/react";
import { mailOutline, lockClosedOutline } from "ionicons/icons";
import { useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const history = useHistory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      // 1️⃣ Login with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg("Invalid email or password");
        console.error("Login error:", error);
        return;
      }

      if (!data.user) {
        setErrorMsg("No user found");
        return;
      }

      console.log("Logged in user:", data.user);

      // 2️⃣ Fetch the user's profile from "profiles" table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, firstname, lastname, role")
        .eq("id", data.user.id) // link by Supabase Auth UUID
        .single();

      if (profileError || !profile) {
        console.error("Profile fetch error:", profileError);
        setErrorMsg("Profile not found. Contact admin.");
        return;
      }

      // 3️⃣ Save profile info in localStorage
      localStorage.setItem("profile_id", profile.id);
      localStorage.setItem("firstname", profile.firstname || "");
      localStorage.setItem("lastname", profile.lastname || "");
      localStorage.setItem("role", profile.role || "user");

      console.log("Profile stored:", profile);

      // 4️⃣ Redirect based on role
      if (profile.role === "admin") {
        history.push("/education/admin/admin_dashboard");
      } else {
        history.push("/education/home");
      }
    } catch (err) {
      console.error("Unexpected login error:", err);
      setErrorMsg("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <IonPage>
      <IonContent className="login-content" fullscreen>
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
