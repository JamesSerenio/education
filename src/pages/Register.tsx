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
  const [showAlert, setShowAlert] = useState(false); // 👈 modal control

  // 🔠 Normalize + auto-capitalize
  const sanitizeInput = (text: string) => {
    if (!text) return "";
    const normalized = text.normalize("NFC").trim();
    return (
      normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
    );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanLastname = sanitizeInput(lastname);
    const cleanFirstname = sanitizeInput(firstname);

    if (
      !cleanLastname ||
      !cleanFirstname ||
      !email ||
      !password ||
      !confirmPassword
    ) {
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
      // 1️⃣ Register user in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
      });

      if (signUpError) throw signUpError;

      const user = data.user;

      // 2️⃣ If Supabase requires email confirmation
      if (!user) {
        setShowAlert(true); // show modal
        setLoading(false);
        return;
      }

      // 3️⃣ Insert new profile manually
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

      // 4️⃣ Show modal to confirm email
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

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="login-wrapper">
          <div className="login-card">
            <h2 className="login-title">Register</h2>

            <form className="login-form" onSubmit={handleRegister}>
              {/* Name Fields */}
              <div
                style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}
              >
                <div className="login-input" style={{ flex: 1 }}>
                  <IonIcon icon={personOutline} />
                  <IonInput
                    type="text"
                    inputMode="text"
                    placeholder="Lastname"
                    value={lastname}
                    onIonChange={(e) => setLastname(e.detail.value ?? "")}
                    required
                  />
                </div>

                <div className="login-input" style={{ flex: 1 }}>
                  <IonIcon icon={personOutline} />
                  <IonInput
                    type="text"
                    inputMode="text"
                    placeholder="Firstname"
                    value={firstname}
                    onIonChange={(e) => setFirstname(e.detail.value ?? "")}
                    required
                  />
                </div>
              </div>

              {/* Email */}
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

              {/* Password */}
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

              {/* Confirm Password */}
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

              {/* Terms Checkbox */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: "0.5rem",
                }}
              >
                <IonCheckbox
                  checked={agreeTerms}
                  onIonChange={(e) => setAgreeTerms(e.detail.checked)}
                  id="terms-checkbox"
                />
                <label
                  htmlFor="terms-checkbox"
                  style={{
                    marginLeft: "0.5rem",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                >
                  I agree to the terms and conditions
                </label>
              </div>

              {/* Error Display */}
              {error && (
                <IonText
                  color="danger"
                  style={{ marginTop: "1rem", display: "block" }}
                >
                  {error}
                </IonText>
              )}

              {/* Submit Button */}
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

        {/* ✅ Modal Alert */}
        <IonAlert
          isOpen={showAlert}
          header="Confirm Your Email"
          message="Registration successful! Please check your email and confirm your account before logging in."
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
