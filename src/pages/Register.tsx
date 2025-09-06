import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonCheckbox,
  IonLabel,
  IonIcon,
  IonText,
} from "@ionic/react";
import { useState } from "react";
import { useHistory, Link } from "react-router-dom";
import { personOutline, mailOutline, lockClosedOutline } from "ionicons/icons";

const Register: React.FC = () => {
  const history = useHistory();

  const [lastname, setLastname] = useState("");
  const [firstname, setFirstname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = (e: React.FormEvent) => {
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

    setError("");

    // TODO: Implement registration logic here (e.g., API call)

    // After successful registration, redirect to login page
    history.push("/education/login");
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="login-wrapper">
          <div className="login-card">
            <h2 className="login-title">Register</h2>

            <form className="login-form" onSubmit={handleRegister}>
              <div className="login-input">
                <IonIcon icon={personOutline} />
                <IonInput
                  placeholder="Lastname"
                  value={lastname}
                  onIonChange={(e) => setLastname(e.detail.value!)}
                  required
                />
              </div>

              <div className="login-input">
                <IonIcon icon={personOutline} />
                <IonInput
                  placeholder="Firstname"
                  value={firstname}
                  onIonChange={(e) => setFirstname(e.detail.value!)}
                  required
                />
              </div>

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

              <div className="login-input">
                <IonIcon icon={lockClosedOutline} />
                <IonInput
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onIonChange={(e) => setConfirmPassword(e.detail.value!)}
                  required
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", marginTop: "0.5rem" }}>
                <IonCheckbox
                  checked={agreeTerms}
                  onIonChange={(e) => setAgreeTerms(e.detail.checked)}
                  id="terms-checkbox"
                />
                <IonLabel htmlFor="terms-checkbox" style={{ marginLeft: "0.5rem", fontSize: "0.875rem" }}>
                  I agree to the terms and conditions
                </IonLabel>
              </div>

              {error && (
                <IonText color="danger" style={{ marginTop: "1rem", display: "block" }}>
                  {error}
                </IonText>
              )}

              <IonButton expand="block" type="submit" className="login-button" style={{ marginTop: "1rem" }}>
                Register
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
