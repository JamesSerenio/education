// src/pages/MotionModule.tsx
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
  module: string;        // "Who Discovered Motion" | "Uniform Motion"
  submodule: string | null; // "velocity" | "time" | "distance" | null
  image_url: string;     // e.g. "xxxx.png" (after fix)
  created_at?: string;
}

interface MotionModuleProps {
  isAdmin?: boolean;
}

const submodules = ["velocity", "time", "distance"];

// ✅ reuse supabaseUrl from client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// Helper para sa public URL
const getPublicImageUrl = (path: string) =>
  `${supabaseUrl}/storage/v1/object/public/module-images/${path}`;

const MotionModule: React.FC<MotionModuleProps> = ({ isAdmin = false }) => {
  const [selectedSubmodule, setSelectedSubmodule] = useState<string>("velocity");
  const [images, setImages] = useState<ModuleImage[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserAndImages = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) setUserId(data.user.id);
      await fetchImages();
    };

    getUserAndImages();
  }, []);

  // 🔹 Fetch lahat ng Motion images
  const fetchImages = async () => {
    const { data, error } = await supabase
      .from("module_images")
      .select("*")
      .eq("subject", "Motion")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching images:", error.message);
      return;
    }
    setImages((data || []) as ModuleImage[]);
  };

  // 🔹 Upload image + insert row sa module_images (FIXED: filePath now just fileName, no bucket prefix)
  const handleUpload = async (moduleName: string, submoduleName: string | null) => {
    if (!file) {
      alert("Select a file to upload.");
      return;
    }
    if (!userId) {
      alert("User not authenticated.");
      return;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      // FIX: filePath is now just the fileName (e.g., "xxxx.png") – no 'module-images/' prefix
      const filePath = fileName;

      // 1. upload to bucket
      const { error: uploadError } = await supabase.storage
        .from("module-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. insert row to table
      const { error: dbError } = await supabase.from("module_images").insert([
        {
          uploaded_by: userId,
          subject: "Motion",
          module: moduleName,
          submodule: submoduleName,
          image_url: filePath,  // Now just "xxxx.png"
        },
      ]);

      if (dbError) throw dbError;

      alert("Image uploaded successfully!");
      setFile(null);
      await fetchImages();
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) alert(err.message);
      else alert("Upload failed");
    }
  };

  // 🔹 Who Discovered Motion (walang submodule)
  const whoDiscovered = images.filter(
    (img) => img.module === "Who Discovered Motion"
  );

  // 🔹 Uniform Motion (velocity, time, distance)
  const uniformMotion = images.filter(
    (img) =>
      img.module === "Uniform Motion" &&
      img.submodule === selectedSubmodule
  );

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen>
        <div className="arithmetic-module-container">
          {/* Who Discovered Motion */}
          <div className="arithmetic-card">
            <h3>Who Discovered Motion</h3>
            <div className="image-scroll-container">
              {whoDiscovered.length > 0 ? (
                whoDiscovered.map((img) => {
                  const url = getPublicImageUrl(img.image_url);
                  console.log("WHO URL:", url);
                  return <img key={img.id} src={url} alt={img.module} />;
                })
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
                  onClick={() =>
                    handleUpload("Who Discovered Motion", null)
                  }
                >
                  Upload Image
                </IonButton>
              </div>
            )}
          </div>

          {/* Uniform Motion */}
          <div className="arithmetic-card">
            <h3>Uniform Motion Module</h3>

            <IonSegment
              value={selectedSubmodule}
              scrollable
              onIonChange={(e: CustomEvent) => {
                const val = e.detail.value as string | null;
                if (val) setSelectedSubmodule(val);
              }}
            >
              {submodules.map((sub) => (
                <IonSegmentButton key={sub} value={sub}>
                  <IonLabel>
                    {sub}
                  </IonLabel>
                </IonSegmentButton>
              ))}
            </IonSegment>

            <div className="image-scroll-container">
              {uniformMotion.length > 0 ? (
                uniformMotion.map((img) => {
                  const url = getPublicImageUrl(img.image_url);
                  console.log("UNIFORM URL:", url);
                  return <img key={img.id} src={url} alt={img.submodule ?? ""} />;
                })
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
                  onClick={() =>
                    handleUpload("Uniform Motion", selectedSubmodule)
                  }
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
