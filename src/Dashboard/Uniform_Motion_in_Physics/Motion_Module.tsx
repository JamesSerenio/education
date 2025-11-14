import { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
} from "@ionic/react";
import { supabase } from "../../utils/supabaseClient";
import { isAdminUser } from "../../utils/adminCheck";

const AdminAddModule: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [subject, setSubject] = useState("Arithmetic");
  const [moduleName, setModuleName] = useState("Who Discovered Arithmetic");
  const [submodule, setSubmodule] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const isAdmin = isAdminUser();

  const submodulesMap: Record<string, string[]> = {
    "Arithmetic Sequence": ["a1", "d", "an"],
    "Uniform Motion": ["velocity", "time", "distance"],
  };

  useEffect(() => {
    if (!isAdmin) alert("Access denied! Only admins can add modules.");
    if (subject === "Arithmetic") setModuleName("Who Discovered Arithmetic");
    else if (subject === "Motion") setModuleName("Who Discovered Motion");
    setSubmodule(null);
  }, [subject, isAdmin]);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) setUserId(data.user.id);
    };
    getUser();
  }, []);

  const handleUpload = async () => {
    if (!file) return alert("Select a file to upload.");
    if (!userId) return alert("User not authenticated.");
    if (!isAdmin) return alert("Only admins can upload.");

    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `module-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("module-images")
      .upload(filePath, file);
    if (uploadError) return alert(uploadError.message);

    const { error: dbError } = await supabase.from("module_images").insert([
      {
        uploaded_by: userId,
        subject,
        module: moduleName,
        submodule,
        image_url: filePath,
      },
    ]);
    if (dbError) return alert(dbError.message);

    alert("Module image uploaded successfully!");
    setFile(null);
    setSubmodule(null);
  };

  const availableSubmodules = submodulesMap[moduleName] || [];

  return (
    <IonPage>
      <IonHeader>
        <h2 style={{ textAlign: "center", padding: "16px" }}>Admin Add Module</h2>
      </IonHeader>
      <IonContent fullscreen style={{ padding: "16px" }}>
        <IonItem>
          <IonLabel>Subject</IonLabel>
          <IonSelect value={subject} onIonChange={e => setSubject(e.detail.value)}>
            <IonSelectOption value="Arithmetic">Arithmetic</IonSelectOption>
            <IonSelectOption value="Motion">Motion</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel>Module</IonLabel>
          <IonSelect value={moduleName} onIonChange={e => setModuleName(e.detail.value)}>
            {subject === "Arithmetic" && (
              <>
                <IonSelectOption value="Who Discovered Arithmetic">Who Discovered Arithmetic</IonSelectOption>
                <IonSelectOption value="Arithmetic Sequence">Arithmetic Sequence</IonSelectOption>
              </>
            )}
            {subject === "Motion" && (
              <>
                <IonSelectOption value="Who Discovered Motion">Who Discovered Motion</IonSelectOption>
                <IonSelectOption value="Uniform Motion">Uniform Motion</IonSelectOption>
              </>
            )}
          </IonSelect>
        </IonItem>

        {availableSubmodules.length > 0 && (
          <IonItem>
            <IonLabel>Submodule</IonLabel>
            <IonSelect value={submodule} onIonChange={e => setSubmodule(e.detail.value)}>
              {availableSubmodules.map(sub => (
                <IonSelectOption key={sub} value={sub}>{sub}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        )}

        <IonItem>
          <IonLabel>Choose Image</IonLabel>
          <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        </IonItem>

        <IonButton expand="block" style={{ marginTop: "16px" }} onClick={handleUpload}>
          Upload Module Image
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default AdminAddModule;
