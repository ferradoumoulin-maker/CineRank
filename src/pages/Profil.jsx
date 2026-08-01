import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";


function Profil() {

  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profil, setProfil] = useState(null);

  const [pseudo, setPseudo] = useState("");
  const [bibliothequeVisible, setBibliothequeVisible] = useState("public");

  const [chargement, setChargement] = useState(true);
  const [sauvegarde, setSauvegarde] = useState(false);
  const [uploadEnCours, setUploadEnCours] = useState(false);


  /* =====================================================
     CHARGER LE PROFIL
     ===================================================== */

  useEffect(() => {

    chargerProfil();

  }, []);


  async function chargerProfil() {

    setChargement(true);


    const {
      data: { user }
    } = await supabase.auth.getUser();


    if (!user) {

      navigate("/connexion");

      return;

    }


    setUser(user);


    const {
      data,
      error
    } = await supabase
      .from("profils")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();


    if (error) {

      console.error(
        "ERREUR CHARGEMENT PROFIL :",
        error
      );

      alert(
        "Impossible de charger ton profil."
      );

      setChargement(false);

      return;

    }


    if (data) {

      setProfil(data);

      setPseudo(data.pseudo || "");

      setBibliothequeVisible(
        data.bibliotheque_visible || "public"
      );

    }


    setChargement(false);

  }


  /* =====================================================
     CHANGER PHOTO DE PROFIL
     ===================================================== */

  async function changerPhoto(e) {

    const fichier = e.target.files?.[0];


    if (!fichier || !user) {
      return;
    }


    /* Vérification type */

    if (!fichier.type.startsWith("image/")) {

      alert(
        "❌ Sélectionne une image."
      );

      return;

    }


    /* Limite 5 Mo */

    if (fichier.size > 5 * 1024 * 1024) {

      alert(
        "❌ L'image ne doit pas dépasser 5 Mo."
      );

      return;

    }


    setUploadEnCours(true);


    try {

      /*
       * On utilise toujours le même nom pour la PP
       * de l'utilisateur.
       */

      const extension =
        fichier.name.split(".").pop().toLowerCase();


      const chemin =
        `${user.id}.${extension}`;


      /* =================================================
         SUPPRESSION DES ANCIENNES EXTENSIONS
         ================================================= */

      const extensions = [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "gif"
      ];


      const anciensFichiers =
        extensions
          .filter(
            (ext) =>
              ext !== extension
          )
          .map(
            (ext) =>
              `${user.id}.${ext}`
          );


      await supabase
        .storage
        .from("avatars")
        .remove(anciensFichiers);


      /* =================================================
         UPLOAD
         ================================================= */

      const {
        error: uploadError
      } = await supabase
        .storage
        .from("avatars")
        .upload(
          chemin,
          fichier,
          {
            upsert: true,
            contentType: fichier.type
          }
        );


      if (uploadError) {

        console.error(
          "ERREUR UPLOAD PHOTO :",
          uploadError
        );

        alert(
          "❌ Impossible d'envoyer la photo."
        );

        return;

      }


      /* =================================================
         RÉCUPÉRER URL PUBLIQUE
         ================================================= */

      const {
        data: urlData
      } = supabase
        .storage
        .from("avatars")
        .getPublicUrl(chemin);


      const avatarUrl =
        `${urlData.publicUrl}?t=${Date.now()}`;


      /* =================================================
         ENREGISTRER URL DANS PROFILS
         ================================================= */

      const {
        data: profilMisAJour,
        error: profilError
      } = await supabase
        .from("profils")
        .upsert({

          user_id: user.id,

          pseudo:
            profil?.pseudo ||
            pseudo.trim() ||
            "Utilisateur",

          bibliotheque_visible:
            profil?.bibliotheque_visible ||
            bibliothequeVisible,

          avatar_url:
            avatarUrl

        })
        .select()
        .single();


      if (profilError) {

        console.error(
          "ERREUR ENREGISTREMENT PHOTO :",
          profilError
        );

        alert(
          "❌ La photo a été envoyée mais impossible de l'enregistrer dans le profil."
        );

        return;

      }


      setProfil(profilMisAJour);


      alert(
        "✅ Photo de profil mise à jour !"
      );

    }
    finally {

      setUploadEnCours(false);

      /*
       * Permet de sélectionner à nouveau
       * exactement le même fichier.
       */

      e.target.value = "";

    }

  }


  /* =====================================================
     SUPPRIMER PHOTO
     ===================================================== */

  async function supprimerPhoto() {

    if (!user || !profil?.avatar_url) {
      return;
    }


    const confirmation =
      window.confirm(
        "⚠️ Supprimer ta photo de profil ?"
      );


    if (!confirmation) {
      return;
    }


    setUploadEnCours(true);


    try {

      const extensions = [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "gif"
      ];


      const fichiers =
        extensions.map(
          (ext) =>
            `${user.id}.${ext}`
        );


      await supabase
        .storage
        .from("avatars")
        .remove(fichiers);


      const {
        data,
        error
      } = await supabase
        .from("profils")
        .update({
          avatar_url: null
        })
        .eq("user_id", user.id)
        .select()
        .single();


      if (error) {

        console.error(
          "ERREUR SUPPRESSION PHOTO :",
          error
        );

        alert(
          "❌ Impossible de supprimer la photo."
        );

        return;

      }


      setProfil(data);


      alert(
        "✅ Photo supprimée."
      );

    }
    finally {

      setUploadEnCours(false);

    }

  }


  /* =====================================================
     SAUVEGARDER PROFIL
     ===================================================== */

  async function sauvegarder() {

    if (!user) {
      return;
    }


    const pseudoPropre =
      pseudo.trim();


    if (!pseudoPropre) {

      alert(
        "⚠️ Tu dois choisir un pseudo."
      );

      return;

    }


    if (pseudoPropre.length < 3) {

      alert(
        "⚠️ Ton pseudo doit faire au moins 3 caractères."
      );

      return;

    }


    setSauvegarde(true);


    const {
      data,
      error
    } = await supabase
      .from("profils")
      .upsert({

        user_id: user.id,

        pseudo: pseudoPropre,

        bibliotheque_visible:
          bibliothequeVisible,

        /*
         * Très important :
         * on conserve la photo existante.
         */

        avatar_url:
          profil?.avatar_url || null

      })
      .select()
      .single();


    setSauvegarde(false);


    if (error) {

      console.error(
        "ERREUR SAUVEGARDE PROFIL :",
        error
      );


      if (
        error.code === "23505"
      ) {

        alert(
          "❌ Ce pseudo est déjà utilisé."
        );

      }
      else {

        alert(
          "❌ Impossible de sauvegarder le profil."
        );

      }


      return;

    }


    setProfil(data);


    alert(
      "✅ Profil sauvegardé !"
    );

  }


  /* =====================================================
     AFFICHAGE
     ===================================================== */

  if (chargement) {

    return (

      <div className="container">

        <p>
          Chargement du profil...
        </p>

      </div>

    );

  }


  return (

    <div className="container">


      <div className="compteBouton">

        <button
          onClick={() =>
            navigate("/")
          }
        >
          ← Retour
        </button>

      </div>


      <h1 className="title">
        👤 Mon profil
      </h1>


      {/* =================================================
          PHOTO DE PROFIL
      ================================================= */}

      <div className="card profilPhotoCard">

        <h2>
          🖼️ Photo de profil
        </h2>


        <div className="profilPhotoZone">


          <div className="profilPhotoCadre">

            {profil?.avatar_url ? (

              <img
                src={profil.avatar_url}
                alt="Photo de profil"
                className="profilPhoto"
              />

            ) : (

              <div className="profilPhotoPlaceholder">

                {pseudo
                  ?.charAt(0)
                  .toUpperCase() || "?"}

              </div>

            )}

          </div>


          <div className="profilPhotoActions">

            <label
              className="profilPhotoButton"
            >

              {uploadEnCours
                ? "⏳ Chargement..."
                : "📷 Changer la photo"}

              <input
                type="file"
                accept="image/*"
                onChange={changerPhoto}
                disabled={uploadEnCours}
                style={{
                  display: "none"
                }}
              />

            </label>


            {profil?.avatar_url && (

              <button
                className="profilPhotoSupprimer"
                onClick={supprimerPhoto}
                disabled={uploadEnCours}
              >
                🗑️ Supprimer
              </button>

            )}


            <p>
              JPG, PNG, WEBP ou GIF · 5 Mo maximum
            </p>

          </div>


        </div>

      </div>


      {/* =================================================
          INFORMATIONS
      ================================================= */}

      <div className="card">


        <h2>
          Informations du compte
        </h2>


        <p>
          📧 {user?.email}
        </p>


        <label>
          Pseudo
        </label>


        <input
          type="text"
          value={pseudo}
          maxLength={30}
          placeholder="Ton pseudo"
          onChange={(e) =>
            setPseudo(e.target.value)
          }
        />


        <p
          style={{
            color: "#888",
            fontSize: "13px"
          }}
        >
          Ton pseudo permettra à tes amis de te
          retrouver sur CineRank.
        </p>


        <h2>
          🔒 Confidentialité
        </h2>


        <label>
          Visibilité de ma bibliothèque
        </label>


        <select
          value={bibliothequeVisible}
          onChange={(e) =>
            setBibliothequeVisible(
              e.target.value
            )
          }
          style={{
            width: "100%",
            padding: "12px",
            margin: "8px 0 15px",
            background: "#222",
            border: "none",
            borderRadius: "8px",
            color: "white",
            fontSize: "16px"
          }}
        >

          <option value="public">
            🌍 Tout le monde
          </option>

          <option value="amis">
            👥 Mes amis uniquement
          </option>

          <option value="prive">
            🔒 Personne
          </option>

        </select>


        <p
          style={{
            color: "#888",
            fontSize: "13px"
          }}
        >
          Tu pourras choisir qui peut voir les
          films de ta bibliothèque.
        </p>


        <button
          onClick={sauvegarder}
          disabled={sauvegarde}
        >

          {sauvegarde
            ? "Sauvegarde..."
            : "💾 Sauvegarder"}

        </button>


      </div>


    </div>

  );

}


export default Profil;