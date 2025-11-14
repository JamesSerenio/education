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
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../utils/supabaseClient";

// ModuleImage interface
interface ModuleImage {
  id: string;
  uploaded_by: string | null;
  subject: string;
  module: string;
  submodule: string | null;
  image_url: string;
  created_at?: string;
}

interface ArithmeticModuleProps {
  isAdmin?: boolean;
}

const ArithmeticModule: React.FC<ArithmeticModuleProps> = ({ isAdmin = false }) => {
  const [selectedModule, setSelectedModule] = useState<string>("Arithmetic Sequence");
  const [selectedSubmodule, setSelectedSubmodule] = useState<string>("a1");
  const [images, setImages] = useState<ModuleImage[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user (Supabase v2)
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error getting user:", error.message);
      } else if (data.user) {
        setUserId(data.user.id);
      }
    };
    getUser();
    fetchImages();
  }, [selectedModule, selectedSubmodule]);

  // Fetch images from Supabase filtered by subject, module, and submodule
  const fetchImages = async () => {
    const { data, error } = await supabase
      .from("module_images")
      .select("*")
      .eq("subject", "Arithmetic")
      .eq("module", selectedModule)
      .eq("submodule", selectedSubmodule)
      .order("created_at", { ascending: true });

    if (error) console.error("Error fetching images:", error.message);
    else if (data) setImages(data as ModuleImage[]);
  };

  // Upload image (admin only)
  const handleUpload = async () => {
    if (!file) return alert("Select a file to upload.");
    if (!userId) return alert("User not authenticated.");

    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `module-images/${fileName}`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from("module-images")
      .upload(filePath, file);

    if (uploadError) return alert(uploadError.message);

    // Insert record to module_images table
    const { error: dbError } = await supabase.from("module_images").insert([
      {
        uploaded_by: userId,
        subject: "Arithmetic",
        module: selectedModule,
        submodule: selectedSubmodule,
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.3, delayChildren: 0.2 }}
          className="arithmetic-module-container"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="arithmetic-card"
          >
            <h3>Arithmetic Modules</h3>

            {/* Module selection */}
            <IonSegment
              value={selectedModule}
              onIonChange={(e: CustomEvent) => {
                const val = e.detail.value;
                if (val) setSelectedModule(val);
              }}
              scrollable
            >
              <IonSegmentButton value="Who Discovered Arithmetic">
                <IonLabel>Who Discovered...</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="Arithmetic Sequence">
                <IonLabel>Arithmetic Sequence</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="Uniform Motion">
                <IonLabel>Uniform Motion</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {/* Submodule selection (only for modules with submodules) */}
            {selectedModule === "Arithmetic Sequence" && (
              <IonSegment
                value={selectedSubmodule}
                onIonChange={(e: CustomEvent) => {
                  const val = e.detail.value;
                  if (val) setSelectedSubmodule(val);
                }}
                scrollable
                style={{ marginTop: "8px" }}
              >
                <IonSegmentButton value="a1">
                  <IonLabel>a₁</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="d">
                  <IonLabel>d</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="an">
                  <IonLabel>aₙ</IonLabel>
                </IonSegmentButton>
              </IonSegment>
            )}

            {/* Scrollable images */}
            <div className="image-scroll-container" style={{ marginTop: "12px" }}>
              <AnimatePresence mode="wait">
                {images.length > 0 ? (
                  images.map((img) => (
                    <motion.img
                      key={img.id}
                      src={`https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/${img.image_url}`}
                      alt={img.submodule ?? ""}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      style={{ marginBottom: "12px" }}
                    />
                  ))
                ) : (
                  <p>No images uploaded for this module/submodule yet.</p>
                )}
              </AnimatePresence>
            </div>

            {/* Admin upload */}
            {isAdmin && (
              <div style={{ marginTop: "16px" }}>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <IonButton onClick={handleUpload}>Upload Image</IonButton>
              </div>
            )}
          </motion.div>
        </motion.div>
      </IonContent>
    </IonPage>
  );
};

export default ArithmeticModule;
