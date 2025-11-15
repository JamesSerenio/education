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

interface ModuleImage {
  id: string;
  uploaded_by: string | null;
  subject: string;
  module: string; // "Who Discovered Motion" | "Uniform Motion"
  submodule: string | null; // velocity, time, distance
  image_url: string;
  created_at?: string;
}

interface MotionModuleProps {
  isAdmin?: boolean;
}

const submodules = ["velocity", "time", "distance"];

const MotionModule: React.FC<MotionModuleProps> = ({ isAdmin = false }) => {
  const [selectedSubmodule, setSelectedSubmodule] = useState<string>("velocity");
  const [images, setImages] = useState<ModuleImage[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

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
      .eq("subject", "Motion")
      .order("created_at", { ascending: true });

    if (!error && data) setImages(data as ModuleImage[]);
  };

  const handleUpload = async (moduleName: string, submoduleName: string | null) => {
    if (!file) return alert("Select a file to upload.");
    if (!userId) return alert("User not authenticated.");

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
        subject: "Motion",
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

  const whoDiscovered = images.filter(
    (img) => img.module === "Who Discovered Motion"
  );
  const uniformMotion = images.filter(
    (img) => img.module === "Uniform Motion" && img.submodule === selectedSubmodule
  );

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen>
        {/* ✅ gamit na layout class from your CSS */}
        <div className="arithmetic-module-container">
          {/* Who Discovered Motion */}
          <div className="arithmetic-card">
            <h3>Who Discovered Motion</h3>

            <div className="image-scroll-container">
              {whoDiscovered.length > 0 ? (
                whoDiscovered.map((img) => (
                  <img
                    key={img.id}
                    src={`https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/${img.image_url}`}
                    alt={img.module}
                  />
                ))
              ) : (
                <p>No image uploaded yet.</p>
              )}
            </div>

            {isAdmin && (
              <div style={{ marginTop: "16px" }}>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <IonButton
                  style={{ marginTop: "8px" }}
                  onClick={() => handleUpload("Who Discovered Motion", null)}
                >
                  Upload Image
                </IonButton>
              </div>
            )}
          </div>

          {/* Uniform Motion Module */}
          <div className="arithmetic-card">
            <h3>Uniform Motion Module</h3>

            <IonSegment
              value={selectedSubmodule}
              onIonChange={(e: CustomEvent) => {
                const val = e.detail.value;
                if (val) setSelectedSubmodule(val);
              }}
              scrollable
            >
              {submodules.map((sub) => (
                <IonSegmentButton key={sub} value={sub}>
                  <IonLabel>{sub}</IonLabel>
                </IonSegmentButton>
              ))}
            </IonSegment>

            <div className="image-scroll-container">
              {uniformMotion.length > 0 ? (
                uniformMotion.map((img) => (
                  <img
                    key={img.id}
                    src={`https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/${img.image_url}`}
                    alt={img.submodule ?? ""}
                  />
                ))
              ) : (
                <p>No image uploaded yet for {selectedSubmodule}.</p>
              )}
            </div>

            {isAdmin && (
              <div style={{ marginTop: "16px" }}>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <IonButton
                  style={{ marginTop: "8px" }}
                  onClick={() => handleUpload("Uniform Motion", selectedSubmodule)}
                >
                  Upload Image
                </IonButton>
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MotionModule;
