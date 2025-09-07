import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonCheckbox,
  IonIcon,
  IonText,
} from "@ionic/react";
import { useState } from "react";
import { useHistory, Link } from "react-router-dom";
import { personOutline, mailOutline, lockClosedOutline } from "ionicons/icons";
import { supabase } from "../utils/supabaseClient"; // adjust path if needed
import type { AuthError, Session, User } from "@supabase/supabase-js";

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lastname || !firstname || !email || !password || !confirmPassword) {
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
      // Explicitly type the response to avoid editor/type errors
      const response: {
        data: { user: User | null; session: Session | null };
        error: AuthError | null;
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstname,
            lastname,
          },
        },
      });

      const { error } = response;

      if (error) {
        setError(error.message);
        console.error("Registration error:", error);
      } else {
        // Registration successful, redirect to login
        history.push("/education/login");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="login-wrapper">
          <div className="login-card">
            <h2 className="login-title">Register</h2>

            <form className="login-form" onSubmit={handleRegister}>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                <div className="login-input" style={{ flex: 1 }}>
                  <IonIcon icon={personOutline} />
                  <IonInput
                    placeholder="Lastname"
                    value={lastname}
                    onIonChange={(e) => setLastname(e.detail.value ?? "")}
                    required
                  />
                </div>

                <div className="login-input" style={{ flex: 1 }}>
                  <IonIcon icon={personOutline} />
                  <IonInput
                    placeholder="Firstname"
                    value={firstname}
                    onIonChange={(e) => setFirstname(e.detail.value ?? "")}
                    required
                  />
                </div>
              </div>

              <div className="login-input">
                <IonIcon icon={mailOutline} />
                <IonInput
                  type="email"
                  placeholder="Email"
                  value={email}
                  onIonChange={(e) => setEmail(e.detail.value ?? "")}
                  required
                />
              </div>

              <div className="login-input">
                <IonIcon icon={lockClosedOutline} />
                <IonInput
                  type="password"
                  placeholder="Password"
                  value={password}
                  onIonChange={(e) => setPassword(e.detail.value ?? "")}
                  required
                />
              </div>

              <div className="login-input">
                <IonIcon icon={lockClosedOutline} />
                <IonInput
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onIonChange={(e) => setConfirmPassword(e.detail.value ?? "")}
                  required
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", marginTop: "0.5rem" }}>
                <IonCheckbox
                  checked={agreeTerms}
                  onIonChange={(e) => setAgreeTerms(e.detail.checked)}
                  id="terms-checkbox"
                />
                <label
                  htmlFor="terms-checkbox"
                  style={{ marginLeft: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}
                >
                  I agree to the terms and conditions
                </label>
              </div>

              {error && (
                <IonText color="danger" style={{ marginTop: "1rem", display: "block" }}>
                  {error}
                </IonText>
              )}

              <IonButton
                expand="block"
                type="submit"
                className="login-button"
                style={{ marginTop: "1rem" }}
                disabled={!agreeTerms || loading}
              >
                {loading ? "Registering..." : "Register"}
              </IonButton>
            </form>

            <p className="login-register" style={{ marginTop: "1rem" }}>
              Have already an account?{" "}
              <Link to="/education/login" className="text-blue-600 font-medium">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;
