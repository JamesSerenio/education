import {
  IonPage,
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
} from "@ionic/react";
import { mailOutline, lockClosedOutline } from "ionicons/icons";

const Login: React.FC = () => {
  return (
    <IonPage>
      <IonContent className="login-content">
        <div className="login-wrapper">
          <div className="login-card">
            <h2 className="login-title">LOGIN</h2>

            <form className="login-form">
              <div className="login-input">
                <IonIcon icon={mailOutline} />
                <IonInput type="email" placeholder="Email" />
              </div>

              <div className="login-input">
                <IonIcon icon={lockClosedOutline} />
                <IonInput type="password" placeholder="Password" />
              </div>

              <IonButton expand="block" type="submit" className="login-button">
                Login
              </IonButton>
            </form>

            <p className="login-register">
              Don’t have an account?{" "}
              <a href="#" className="text-blue-600 font-medium">
                Register
              </a>
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
