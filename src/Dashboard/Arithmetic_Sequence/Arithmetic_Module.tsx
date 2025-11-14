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

// ModuleImage interface
interface ModuleImage {
  id: string;
  uploaded_by: string | null;
  subject: string; // Always "Arithmetic"
  module: string; // "Who Discovered Arithmetic" or "Arithmetic Sequence"
  submodule: string | null; // "a1", "d", "an" or null
  image_url: string;
  created_at?: string;
}

interface ArithmeticModuleProps {
  isAdmin?: boolean;
}

const modules = [
  { name: "Who Discovered Arithmetic", hasSubmodule: false },
  { name: "Arithmetic Sequence", hasSubmodule: true },
];

const submodules = ["a1", "d", "an"];

const ArithmeticModule: React.FC<ArithmeticModuleProps> = ({ isAdmin = false }) => {
  const [selectedModule, setSelectedModule] = useState<string>("Arithmetic Sequence");
  const [selectedSubmodule, setSelectedSubmodule] = useState<string>("a1");
  const [images, setImages] = useState<ModuleImage[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error(error.message);
      else if (data.user) setUserId(data.user.id);
    };
    getUser();
    fetchImages();
  }, [selectedModule, selectedSubmodule]);

  const fetchImages = async () => {
    let query = supabase
      .from("module_images")
      .select("*")
      .eq("subject", "Arithmetic")
      .eq("module", selectedModule);

    if (modules.find((m) => m.name === selectedModule)?.hasSubmodule) {
      query = query.eq("submodule", selectedSubmodule);
    }

    const { data, error } = await query.order("created_at", { ascending: true });
    if (error) console.error(error.message);
    else if (data) setImages(data as ModuleImage[]);
  };

  const handleUpload = async () => {
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
        subject: "Arithmetic",
        module: selectedModule,
        submodule: modules.find((m) => m.name === selectedModule)?.hasSubmodule
          ? selectedSubmodule
          : null,
        image_url: filePath,
      },
    ]);

    if (dbError) return alert(dbError.message);

    alert("Image uploaded successfully!");
    setFile(null);
    fetchImages();
  };

  return (
    <IonPage>
      <IonHeader />
      <IonContent fullscreen>
        <div className="arithmetic-module-container" style={{ padding: "16px" }}>
          <h3>Arithmetic Module Images</h3>

          {/* Module & Submodule selectors side by side */}
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
            {/* Module selection */}
            <IonSegment
              value={selectedModule}
              onIonChange={(e: CustomEvent) => {
                const val = e.detail.value;
                if (val) setSelectedModule(val);
              }}
              scrollable
            >
              {modules.map((mod) => (
                <IonSegmentButton key={mod.name} value={mod.name}>
                  <IonLabel>{mod.name}</IonLabel>
                </IonSegmentButton>
              ))}
            </IonSegment>

            {/* Submodule selection */}
            {modules.find((m) => m.name === selectedModule)?.hasSubmodule && (
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
            )}
          </div>

          {/* Images display */}
          <div className="image-scroll-container">
            {images.length > 0 ? (
              images.map((img) => (
                <img
                  key={img.id}
                  src={`https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/${img.image_url}`}
                  alt={img.submodule ?? img.module}
                  style={{ marginBottom: "12px", width: "100%", borderRadius: "8px" }}
                />
              ))
            ) : (
              <p>No images uploaded for this selection yet.</p>
            )}
          </div>

          {/* Admin Upload */}
          {isAdmin && (
            <div style={{ marginTop: "16px" }}>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <IonButton onClick={handleUpload}>Upload Image</IonButton>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ArithmeticModule;
