import { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonButton,
} from "@ionic/react";
import { supabase } from "../../utils/supabaseClient";
import { isAdminUser } from "../../utils/adminCheck";

interface ModuleImage {
  id: string;
  uploaded_by: string | null;
  subject: string;
  module: string; // "Who Discovered Arithmetic" | "Arithmetic Sequence"
  submodule: string | null; // a1, d, an
  image_url: string;
  created_at?: string;
}

const submodules = ["a1", "d", "an"];

const ArithmeticModule: React.FC = () => {
  const [selectedSubmodule, setSelectedSubmodule] = useState("a1");
  const [images, setImages] = useState<ModuleImage[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const isAdmin = isAdminUser();

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) setUserId(data.user.id);
    };
    getUser();
    fetchImages();
  }, [selectedSubmodule]);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from("module_images")
      .select("*")
      .eq("subject", "Arithmetic")
      .order("created_at", { ascending: true });

    if (!error && data) setImages(data as ModuleImage[]);
  };

  const handleUpload = async (moduleName: string, submoduleName: string | null) => {
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
        subject: "Arithmetic",
        module: moduleName,
        submodule: submoduleName,
        image_url: filePath,
      },
    ]);
    if (dbError) return alert(dbError.message);

    alert("Image uploaded successfully!");
    setFile(null);
    fetchImages();
  };

  const whoDiscovered = images.filter(img => img.module === "Who Discovered Arithmetic");
  const arithmeticSeq = images.filter(
    img => img.module === "Arithmetic Sequence" && img.submodule === selectedSubmodule
  );

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen>
        <div style={{ display: "flex", gap: "24px", padding: "16px", flexWrap: "wrap" }}>
          {/* Who Discovered */}
          <div style={{ flex: 1, minWidth: "300px", border: "1px solid #ccc", borderRadius: "12px", padding: "16px" }}>
            <h3>Who Discovered Arithmetic</h3>
            {whoDiscovered.length > 0 ? (
              whoDiscovered.map(img => (
                <img
                  key={img.id}
                  src={`https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/${img.image_url}`}
                  alt={img.module}
                  style={{ width: "100%", borderRadius: "8px", marginBottom: "12px" }}
                />
              ))
            ) : (
              <p>No image uploaded yet.</p>
            )}
            {isAdmin && (
              <div>
                <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                <IonButton onClick={() => handleUpload("Who Discovered Arithmetic", null)}>Upload Image</IonButton>
              </div>
            )}
          </div>

          {/* Arithmetic Sequence */}
          <div style={{ flex: 2, minWidth: "400px", border: "1px solid #ccc", borderRadius: "12px", padding: "16px" }}>
            <h3>Module for Arithmetic Sequence</h3>
            <IonSegment
              value={selectedSubmodule}
              onIonChange={(e: CustomEvent) => setSelectedSubmodule(e.detail.value)}
              scrollable
            >
              {submodules.map(sub => (
                <IonSegmentButton key={sub} value={sub}>
                  <IonLabel>{sub}</IonLabel>
                </IonSegmentButton>
              ))}
            </IonSegment>

            {arithmeticSeq.length > 0 ? (
              arithmeticSeq.map(img => (
                <img
                  key={img.id}
                  src={`https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/${img.image_url}`}
                  alt={img.submodule ?? ""}
                  style={{ width: "100%", borderRadius: "8px", marginTop: "12px" }}
                />
              ))
            ) : (
              <p>No image uploaded yet for {selectedSubmodule}.</p>
            )}

            {isAdmin && (
              <div style={{ marginTop: "16px" }}>
                <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                <IonButton onClick={() => handleUpload("Arithmetic Sequence", selectedSubmodule)}>Upload Image</IonButton>
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ArithmeticModule;
