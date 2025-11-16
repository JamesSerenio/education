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
  IonIcon,
  IonAlert,
  IonModal,
  IonSegment,
  IonSegmentButton,
  IonList,
  IonItem as IonListItem,
  IonText,
  IonImg,
} from "@ionic/react";
import { createOutline, archiveOutline, trashOutline } from "ionicons/icons";
import { supabase } from "../utils/supabaseClient";

interface ModuleImage {
  id: string;
  uploaded_by: string;
  subject: string;
  module: string;
  submodule: string | null;
  image_url: string;
  created_at: string;
  archived?: boolean;
}

const AdminAddModule: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [subject, setSubject] = useState<string>("Arithmetic");
  const [moduleName, setModuleName] = useState<string>("Who Discovered Arithmetic");
  const [submodule, setSubmodule] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [moduleImages, setModuleImages] = useState<ModuleImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editImage, setEditImage] = useState<ModuleImage | null>(null);
  const [editModule, setEditModule] = useState<string>("");
  const [editSubmodule, setEditSubmodule] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Define available submodules for each subject/module
  const submodulesMap: Record<string, string[]> = {
    "Arithmetic Sequence": ["a1", "d", "an"],
    "Uniform Motion": ["velocity", "time", "distance"],
  };

  // Update default module when subject changes
  useEffect(() => {
    if (subject === "Arithmetic") setModuleName("Who Discovered Arithmetic");
    else if (subject === "Motion") setModuleName("Who Discovered Motion");
    setSubmodule(null); // reset submodule when subject/module changes
  }, [subject]);

  // Get authenticated user
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) setUserId(data.user.id);
    };
    getUser();
  }, []);

  // Fetch module images
  const fetchModuleImages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("module_images")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching module images:", error.message);
      setModuleImages([]);
    } else {
      setModuleImages(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchModuleImages();
  }, []);

  const handleUpload = async () => {
    if (!file) return alert("Select a file to upload.");
    if (!userId) return alert("User not authenticated.");

    try {
      // Upload file to Supabase storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `module-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("module-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Insert record into module_images table
      const { error: dbError } = await supabase.from("module_images").insert([
        {
          uploaded_by: userId,
          subject,
          module: moduleName,
          submodule,
          image_url: filePath,
        },
      ]);

      if (dbError) throw dbError;

      alert("Module image uploaded successfully!");
      setFile(null);
      setSubmodule(null);
      fetchModuleImages(); // Refresh list
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert("Upload failed");
    }
  };

  // Archive image
  const handleArchive = async () => {
    if (!archiveId) return;
    const { error } = await supabase
      .from("module_images")
      .update({ archived: true })
      .eq("id", archiveId);
    if (error) console.error("Error archiving image:", error.message);
    else {
      setModuleImages(moduleImages.map(img => img.id === archiveId ? { ...img, archived: true } : img));
    }
    setArchiveId(null);
  };

  // Permanent delete
  const handleDelete = async () => {
    if (!deleteId) return;
    const imageToDelete = moduleImages.find(img => img.id === deleteId);
    if (imageToDelete) {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("module-images")
        .remove([imageToDelete.image_url]);
      if (storageError) console.error("Error deleting from storage:", storageError.message);
    }
    // Delete from DB
    const { error } = await supabase.from("module_images").delete().eq("id", deleteId);
    if (error) console.error("Error deleting image:", error.message);
    else setModuleImages(moduleImages.filter(img => img.id !== deleteId));
    setDeleteId(null);
  };

  // Open edit modal
  const openEdit = (image: ModuleImage) => {
    setEditImage(image);
    setEditModule(image.module);
    setEditSubmodule(image.submodule);
  };

  // Save edit
  const handleEditSave = async () => {
    if (!editImage) return;
    const { error } = await supabase
      .from("module_images")
      .update({
        module: editModule,
        submodule: editSubmodule,
      })
      .eq("id", editImage.id);
    if (error) console.error("Error updating image:", error.message);
    else {
      setModuleImages(moduleImages.map(img => img.id === editImage.id ? { ...img, module: editModule, submodule: editSubmodule } : img));
      setEditImage(null);
    }
  };

  // Get available submodules for the selected module (for upload)
  const availableSubmodules = submodulesMap[moduleName] || [];

  // Get available submodules for the edit module
  const editAvailableSubmodules = submodulesMap[editModule] || [];

  // Filter images by subject and archived status
  const currentSubject = subject;
  const filteredImages = moduleImages.filter(img => img.subject === currentSubject && (showArchived ? img.archived : !img.archived));

  // Group by module, then submodule
  const groupedImages = filteredImages.reduce((acc: { [key: string]: { [key: string]: ModuleImage[] } }, img) => {
    const mod = img.module;
    const sub = img.submodule || "No Submodule";
    if (!acc[mod]) acc[mod] = {};
    if (!acc[mod][sub]) acc[mod][sub] = [];
    acc[mod][sub].push(img);
    return acc;
  }, {});

  const modules = Object.keys(groupedImages).sort();

  return (
    <IonPage>
      <IonHeader>
        <h2 style={{ textAlign: "center", padding: "16px" }}>Admin Add Module</h2>
      </IonHeader>
      <IonContent fullscreen style={{ padding: "16px" }}>
        {/* Upload Form */}
        <IonItem>
          <IonLabel>Subject</IonLabel>
          <IonSelect value={subject} onIonChange={(e) => setSubject(e.detail.value!)}>
            <IonSelectOption value="Arithmetic">Arithmetic</IonSelectOption>
            <IonSelectOption value="Motion">Motion</IonSelectOption>
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel>Module</IonLabel>
          <IonSelect value={moduleName} onIonChange={(e) => setModuleName(e.detail.value!)}>
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
            <IonSelect value={submodule} onIonChange={(e) => setSubmodule(e.detail.value!)}>
              {availableSubmodules.map((sub) => (
                <IonSelectOption key={sub} value={sub}>
                  {sub}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        )}

        <IonItem>
          <IonLabel>Choose Image</IonLabel>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </IonItem>

        <IonButton expand="block" style={{ marginTop: "16px" }} onClick={handleUpload}>
          Upload Module Image
        </IonButton>

        {/* Toggle Active/Archived */}
        <IonSegment value={showArchived ? "archived" : "active"} onIonChange={(e) => setShowArchived(e.detail.value === "archived")}>
          <IonSegmentButton value="active">
            <IonLabel>Active Images</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="archived">
            <IonLabel>Archived Images</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {/* List of Images */}
        {loading ? (
          <div>Loading images...</div>
        ) : (
          modules.map((mod) => (
            <div key={mod} style={{ marginBottom: "2rem" }}>
              <h3>{mod}</h3>
              {Object.keys(groupedImages[mod]).sort().map((sub) => (
                <div key={sub} style={{ marginLeft: "1rem", marginBottom: "1rem" }}>
                  <h4>{sub}</h4>
                  <IonList>
                    {groupedImages[mod][sub].map((img) => (
                      <IonListItem key={img.id}>
                        <IonImg src={supabase.storage.from("module-images").getPublicUrl(img.image_url).data.publicUrl} style={{ width: "100px", height: "100px", objectFit: "cover" }} />
                        <IonText style={{ marginLeft: "1rem" }}>
                          <p>Uploaded: {new Date(img.created_at).toLocaleDateString()}</p>
                        </IonText>
                        <IonButton fill="clear" size="small" color="primary" onClick={() => openEdit(img)}>
                          <IonIcon icon={createOutline} />
                        </IonButton>
                        {!showArchived && (
                          <IonButton fill="clear" size="small" color="warning" onClick={() => setArchiveId(img.id)}>
                            <IonIcon icon={archiveOutline} />
                          </IonButton>
                        )}
                        <IonButton fill="clear" size="small" color="danger" onClick={() => setDeleteId(img.id)}>
                          <IonIcon icon={trashOutline} />
                        </IonButton>
                      </IonListItem>
                    ))}
                  </IonList>
                </div>
              ))}
            </div>
          ))
        )}

        {/* Archive Alert */}
        <IonAlert
          isOpen={!!archiveId}
          onDidDismiss={() => setArchiveId(null)}
          header="Confirm Archive"
          message="Are you sure you want to archive this image?"
          buttons={[
            { text: "Cancel", role: "cancel" },
            { text: "Archive", cssClass: "warning-button", handler: handleArchive },
          ]}
        />

        {/* Delete Alert */}
        <IonAlert
          isOpen={!!deleteId}
          onDidDismiss={() => setDeleteId(null)}
          header="Confirm Delete"
          message="Are you sure you want to permanently delete this image?"
          buttons={[
            { text: "Cancel", role: "cancel" },
            { text: "Delete", cssClass: "danger-button", handler: handleDelete },
          ]}
        />

        {/* Edit Modal */}
        <IonModal isOpen={!!editImage} onDidDismiss={() => setEditImage(null)}>
          <IonHeader>
            <h2 style={{ textAlign: "center", padding: "16px" }}>Edit Module Image</h2>
          </IonHeader>
          <IonContent style={{ padding: "16px" }}>
            <IonItem>
              <IonLabel>Module</IonLabel>
              <IonSelect value={editModule} onIonChange={(e) => setEditModule(e.detail.value!)}>
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

            {editAvailableSubmodules.length > 0 && (
              <IonItem>
                <IonLabel>Submodule</IonLabel>
                <IonSelect value={editSubmodule} onIonChange={(e) => setEditSubmodule(e.detail.value!)}>
                  {editAvailableSubmodules.map((sub) => (
                    <IonSelectOption key={sub} value={sub}>
                      {sub}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            )}

            <IonButton expand="block" style={{ marginTop: "16px" }} onClick={handleEditSave}>
              Save Changes
            </IonButton>
            <IonButton expand="block" fill="outline" style={{ marginTop: "8px" }} onClick={() => setEditImage(null)}>
              Cancel
            </IonButton>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default AdminAddModule;
