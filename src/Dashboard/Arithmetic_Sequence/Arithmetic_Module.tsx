// src/pages/ArithmeticModule.tsx
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
  module: string; // "Who Discovered Arithmetic" | "Arithmetic Sequence"
  submodule: string | null; // "a1", "d", "an"
  image_url: string;
  created_at?: string;
}

interface ArithmeticModuleProps {
  isAdmin?: boolean;
}

const submodules = ["a1", "d", "an"];

// ✅ Get Supabase URL from env (same as in supabaseClient)
const PROJECT_URL = import.meta.env.VITE_SUPABASE_URL;

// Helper para di ka paulit-ulit
const getPublicImageUrl = (path: string) =>
  `${PROJECT_URL}/storage/v1/object/public/${path}`;

const ArithmeticModule: React.FC<ArithmeticModuleProps> = ({ isAdmin = false }) => {
  const [selectedSubmodule, setSelectedSubmodule] = useState<string>("a1");
  const [images, setImages] = useState<ModuleImage[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get logged-in user + fetch images
  useEffect(() => {
    const getUserAndImages = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        setUserId(data.user.id);
      }
      await fetchImages();
    };

    getUserAndImages();
  }, []);

  // Fetch all Arithmetic images
  const fetchImages = async () => {
    const { data, error } = await supabase
      .from("module_images")
      .select("*")
      .eq("subject", "Arithmetic")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching images:", error.message);
      return;
    }
    if (data) setImages(data as ModuleImage[]);
  };

  const handleUpload = async (moduleName: string, submoduleName: string | null) => {
    if (!file) return alert("Select a file to upload.");
    if (!userId) return alert("User not authenticated.");

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `module-images/${fileName}`;

      // 1️⃣ Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("module-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2️⃣ Insert row to module_images
      const { error: dbError } = await supabase.from("module_images").insert([
        {
          uploaded_by: userId,
          subject: "Arithmetic",
          module: moduleName,
          submodule: submoduleName,
          image_url: filePath,
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

  // Who Discovered Arithmetic (no submodule)
  const whoDiscovered = images.filter(
    (img) => img.module === "Who Discovered Arithmetic"
  );

  // Arithmetic Sequence (a1, d, an)
  const arithmeticSequence = images.filter(
    (img) =>
      img.module === "Arithmetic Sequence" &&
      img.submodule === selectedSubmodule
  );

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen>
        {/* ✅ uses your CSS classes */}
        <div className="arithmetic-module-container">
          {/* ─────────────── Who Discovered Arithmetic ─────────────── */}
          <div className="arithmetic-card">
            <h3>Who Discovered Arithmetic</h3>
            <div className="image-scroll-container">
              {whoDiscovered.length > 0 ? (
                whoDiscovered.map((img) => (
                  <img
                    key={img.id}
                    src={getPublicImageUrl(img.image_url)}
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
                  onClick={() =>
                    handleUpload("Who Discovered Arithmetic", null)
                  }
                >
                  Upload Image
                </IonButton>
              </div>
            )}
          </div>

          {/* ─────────────── Arithmetic Sequence Module ─────────────── */}
          <div className="arithmetic-card">
            <h3>Arithmetic Sequence Module</h3>

            <IonSegment
              value={selectedSubmodule}
              onIonChange={(e: CustomEvent) => {
                const val = e.detail.value as string | null;
                if (val) setSelectedSubmodule(val);
              }}
              scrollable
            >
              {submodules.map((sub) => (
                <IonSegmentButton key={sub} value={sub}>
                  <IonLabel>
                    {sub === "a1" ? "a₁" : sub === "d" ? "D" : "aₙ"}
                  </IonLabel>
                </IonSegmentButton>
              ))}
            </IonSegment>

            <div className="image-scroll-container">
              {arithmeticSequence.length > 0 ? (
                arithmeticSequence.map((img) => (
                  <img
                    key={img.id}
                    src={getPublicImageUrl(img.image_url)}
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
                  onClick={() =>
                    handleUpload("Arithmetic Sequence", selectedSubmodule)
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

export default ArithmeticModule;
