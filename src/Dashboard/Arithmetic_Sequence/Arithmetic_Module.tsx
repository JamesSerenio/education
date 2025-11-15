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
  const [selected, setSelected] = useState<string>("a1");
  const [images, setImages] = useState<ModuleImage[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ Get current user (Supabase v2)
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
  }, []);

  // Fetch images from Supabase
  const fetchImages = async () => {
    const { data, error } = await supabase
      .from("module_images")
      .select("*")
      .eq("subject", "Arithmetic")
      .eq("module", "Arithmetic Sequence")
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

    // Insert record to module_images
    const { error: dbError } = await supabase.from("module_images").insert([
      {
        uploaded_by: userId,
        subject: "Arithmetic",
        module: "Arithmetic Sequence",
        submodule: selected,
        image_url: filePath,
      },
    ]);

    if (dbError) return alert(dbError.message);

    alert("Image uploaded successfully!");
    setFile(null);
    fetchImages();
  };

  // Filter images by selected submodule
  const filteredImages = images.filter((img) => img.submodule === selected);

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
          {/* Arithmetic Sequence Module */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="arithmetic-card"
          >
            <h3>Module for Arithmetic Sequence</h3>

            {/* Segment Tabs */}
            <IonSegment
              value={selected}
              onIonChange={(e: CustomEvent) => {
                const val = e.detail.value;
                if (val) setSelected(val);
              }}
              scrollable
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

            {/* Scrollable Images */}
            <div className="image-scroll-container">
              <AnimatePresence mode="wait">
                {filteredImages.length > 0 ? (
                  filteredImages.map((img) => (
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
                  <p>No images uploaded for this submodule yet.</p>
                )}
              </AnimatePresence>
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
          </motion.div>
        </motion.div>
      </IonContent>
    </IonPage>
  );
};

export default ArithmeticModule;
 