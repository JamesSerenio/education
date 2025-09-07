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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      console.error("Login error:", error);
    } else {
      console.log("Logged in user:", data.user);
      // Redirect to home page or wherever you want
      history.push("/education/home");
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
              <Link to="/education/register" className="text-blue-600 font-medium">
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
