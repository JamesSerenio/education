// src/pages/AdminModule.tsx
import { useState, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonModal,
  IonLabel,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonAlert,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import { supabase } from "../utils/supabaseClient";

interface ModuleImage {
  id: string;
  uploaded_by: string | null;
  subject: string;
  module: string;
  submodule: string | null;
  image_url: string;
  created_at?: string;
}

interface ArchivedModuleImage extends ModuleImage {
  archived_at: string;
}

interface AdminModuleProps {
  isAdmin?: boolean;
}

const subjects = ["Arithmetic", "Motion"]; // Add more if needed
const modules = {
  Arithmetic: ["Who Discovered Arithmetic", "Arithmetic Sequence"],
  Motion: ["Who Discovered Motion", "Uniform Motion"],
};
const submodules = {
  "Arithmetic Sequence": ["a1", "d", "an"],
  "Uniform Motion": ["velocity", "time", "distance"],
};

// ✅ reuse supabaseUrl from client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// Helper para sa public URL
const getPublicImageUrl = (path: string) =>
  `${supabaseUrl}/storage/v1/object/public/module-images/${path}`;

const AdminModule: React.FC<AdminModuleProps> = ({ isAdmin = false }) => {
  const [view, setView] = useState<"active" | "archived">("active");
  const [images, setImages] = useState<ModuleImage[]>([]);
  const [archivedImages, setArchivedImages] = useState<ArchivedModuleImage[]>([]);
  const [editingImage, setEditingImage] = useState<ModuleImage | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
    fetchArchivedImages();
  }, []);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from("module_images")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching images:", error.message);
      return;
    }
    setImages((data || []) as ModuleImage[]);
  };

  const fetchArchivedImages = async () => {
    const { data, error } = await supabase
      .from("archived_module_images")
      .select("*")
      .order("archived_at", { ascending: false });

    if (error) {
      console.error("Error fetching archived images:", error.message);
      return;
    }
    setArchivedImages((data || []) as ArchivedModuleImage[]);
  };

  const handleEdit = (image: ModuleImage) => {
    setEditingImage({ ...image });
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!editingImage) return;

    const { error } = await supabase
      .from("module_images")
      .update({
        subject: editingImage.subject,
        module: editingImage.module,
        submodule: editingImage.submodule,
      })
      .eq("id", editingImage.id);

    if (error) {
      alert("Error updating image: " + error.message);
      return;
    }

    alert("Image updated successfully!");
    setShowEditModal(false);
    setEditingImage(null);
    fetchImages();
  };

  const handleArchive = async (id: string) => {
    const image = images.find((img) => img.id === id);
    if (!image) return;

    // Insert to archive
    const { error: insertError } = await supabase
      .from("archived_module_images")
      .insert({
        ...image,
        archived_at: new Date().toISOString(),
      });

    if (insertError) {
      alert("Error archiving image: " + insertError.message);
      return;
    }

    // Delete from main
    const { error: deleteError } = await supabase
      .from("module_images")
      .delete()
      .eq("id", id);

    if (deleteError) {
      alert("Error deleting image: " + deleteError.message);
      return;
    }

    alert("Image archived successfully!");
    fetchImages();
    fetchArchivedImages();
  };

  const handleRetrieve = async (id: string) => {
    const archivedImage = archivedImages.find((img) => img.id === id);
    if (!archivedImage) return;

    // Insert back to main (keep the same id, exclude archived_at)
    const mainImage: ModuleImage = {
      id: archivedImage.id,
      uploaded_by: archivedImage.uploaded_by,
      subject: archivedImage.subject,
      module: archivedImage.module,
      submodule: archivedImage.submodule,
      image_url: archivedImage.image_url,
      created_at: archivedImage.created_at,
    };
    const { error: insertError } = await supabase
      .from("module_images")
      .insert(mainImage);

    if (insertError) {
      alert("Error retrieving image: " + insertError.message);
      return;
    }

    // Delete from archive
    const { error: deleteError } = await supabase
      .from("archived_module_images")
      .delete()
      .eq("id", id);

    if (deleteError) {
      alert("Error deleting from archive: " + deleteError.message);
      return;
    }

    alert("Image retrieved successfully!");
    fetchImages();
    fetchArchivedImages();
  };

  const currentImages = view === "active" ? images : archivedImages;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Module Images Manager</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonSegment
          value={view}
          onIonChange={(e: CustomEvent) => setView(e.detail.value)}
        >
          <IonSegmentButton value="active">
            <IonLabel>Active Images</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="archived">
            <IonLabel>Archived Images</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        <IonGrid>
          <IonRow>
            {currentImages.map((img) => (
              <IonCol size="12" sizeMd="6" sizeLg="4" key={img.id}>
                <IonCard>
                  <IonCardContent>
                    <img
                      src={getPublicImageUrl(img.image_url)}
                      alt={img.module}
                      style={{ width: "100%", height: "auto" }}
                    />
                    <p><strong>Subject:</strong> {img.subject}</p>
                    <p><strong>Module:</strong> {img.module}</p>
                    <p><strong>Submodule:</strong> {img.submodule || "N/A"}</p>
                    <p><strong>Uploaded:</strong> {new Date(img.created_at || "").toLocaleDateString()}</p>
                    {view === "archived" && (
                      <p><strong>Archived:</strong> {new Date((img as ArchivedModuleImage).archived_at).toLocaleDateString()}</p>
                    )}
                    {isAdmin && view === "active" && (
                      <div>
                        <IonButton
                          fill="outline"
                          onClick={() => handleEdit(img)}
                        >
                          Edit
                        </IonButton>
                        <IonButton
                          fill="outline"
                          color="danger"
                          onClick={() => setShowDeleteAlert(img.id)}
                        >
                          Archive
                        </IonButton>
                      </div>
                    )}
                    {isAdmin && view === "archived" && (
                      <IonButton
                        fill="outline"
                        color="success"
                        onClick={() => handleRetrieve(img.id)}
                      >
                        Retrieve
                      </IonButton>
                    )}
                  </IonCardContent>
                </IonCard>
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>

        {/* Edit Modal */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Edit Image</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {editingImage && (
              <div style={{ padding: "16px" }}>
                <IonItem>
                  <IonLabel position="stacked">Subject</IonLabel>
                  <IonSelect
                    value={editingImage.subject}
                    onIonChange={(e: CustomEvent) => setEditingImage({ ...editingImage, subject: e.detail.value })}
                  >
                    {subjects.map((sub) => (
                      <IonSelectOption key={sub} value={sub}>
                        {sub}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Module</IonLabel>
                  <IonSelect
                    value={editingImage.module}
                    onIonChange={(e: CustomEvent) => setEditingImage({ ...editingImage, module: e.detail.value, submodule: null })}
                  >
                    {modules[editingImage.subject as keyof typeof modules]?.map((mod) => (
                      <IonSelectOption key={mod} value={mod}>
                        {mod}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
                {submodules[editingImage.module as keyof typeof submodules] && (
                  <IonItem>
                    <IonLabel position="stacked">Submodule</IonLabel>
                    <IonSelect
                      value={editingImage.submodule}
                      onIonChange={(e: CustomEvent) => setEditingImage({ ...editingImage, submodule: e.detail.value })}
                    >
                      <IonSelectOption value={null}>None</IonSelectOption>
                      {submodules[editingImage.module as keyof typeof submodules].map((sub) => (
                        <IonSelectOption key={sub} value={sub}>
                          {sub}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>
                )}
                <IonButton expand="full" onClick={saveEdit}>
                  Save Changes
                </IonButton>
                <IonButton expand="full" fill="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </IonButton>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Delete Alert */}
        <IonAlert
          isOpen={!!showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(null)}
          header="Confirm Archive"
          message="Are you sure you want to archive this image?"
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
            },
            {
              text: "Archive",
              role: "destructive",
              handler: () => {
                if (showDeleteAlert) handleArchive(showDeleteAlert);
              },
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminModule;
