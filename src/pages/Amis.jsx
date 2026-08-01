import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";

function Amis() {
  const navigate = useNavigate();

  const [amis, setAmis] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [traitementDemande, setTraitementDemande] = useState(null);

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    setChargement(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/connexion");
      return;
    }

    await Promise.all([
      chargerAmis(user.id),
      chargerDemandes(user.id),
    ]);

    setChargement(false);
  }

  /* =========================================================
     CHARGER LES AMIS
     ========================================================= */

  async function chargerAmis(userId) {
  const { data, error } = await supabase
    .from("amis")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("ERREUR AMIS :", error);
    setAmis([]);
    return;
  }

  if (!data || data.length === 0) {
    setAmis([]);
    return;
  }

  const ids = data.map((ami) => ami.ami_id);

  const {
    data: profils,
    error: profilsError,
  } = await supabase
    .from("profils")
    .select("user_id, pseudo, avatar_url")
    .in("user_id", ids);

  if (profilsError) {
    console.error(
      "Erreur chargement profils amis :",
      profilsError
    );

    setAmis([]);
    return;
  }

  const amisComplets = data.map((ami) => {
    const profil = profils?.find(
      (p) => p.user_id === ami.ami_id
    );

    return {
      id: ami.ami_id,
      relationId: ami.id,
      pseudo: profil?.pseudo || "Utilisateur",
      avatar_url: profil?.avatar_url || null,
    };
  });

  setAmis(amisComplets);
}

  /* =========================================================
     CHARGER LES DEMANDES REÇUES
     ========================================================= */

  async function chargerDemandes(userId) {
    const {
      data,
      error,
    } = await supabase
      .from("demandes_amis")
      .select(
        "id, expediteur_id, destinataire_id, statut, created_at"
      )
      .eq("destinataire_id", userId)
      .eq("statut", "en_attente")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Erreur chargement demandes d'amis :",
        error
      );

      setDemandes([]);
      return;
    }

    if (!data || data.length === 0) {
      setDemandes([]);
      return;
    }

    const ids = data.map(
      (demande) => demande.expediteur_id
    );

    const {
      data: profils,
      error: profilsError,
    } = await supabase
      .from("profils")
      .select("user_id, pseudo, avatar_url")
      .in("user_id", ids);

    if (profilsError) {
      console.error(
        "Erreur chargement profils demandes :",
        profilsError
      );

      setDemandes([]);
      return;
    }

    const demandesCompletes = data.map((demande) => {
      const profil = profils?.find(
        (p) =>
          p.user_id === demande.expediteur_id
      );

      return {
        ...demande,
        pseudo:
          profil?.pseudo || "Utilisateur",
        avatar_url:
          profil?.avatar_url || null,
      };
    });

    setDemandes(demandesCompletes);
  }

  /* =========================================================
     ACCEPTER UNE DEMANDE
     ========================================================= */

  async function accepterDemande(demande) {
    if (traitementDemande) return;

    setTraitementDemande(demande.id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/connexion");
      return;
    }

    try {
      /*
       * On ajoute l'expéditeur dans les amis
       * du destinataire.
       */

      const { error: erreur1 } = await supabase
        .from("amis")
        .insert({
  user_id: user.id,
  ami_id: demande.expediteur_id,
});

      if (erreur1) {
        /*
         * Si l'amitié existe déjà, on continue.
         * Sinon on arrête.
         */

        if (
          !String(erreur1.message || "")
            .toLowerCase()
            .includes("duplicate")
        ) {
          throw erreur1;
        }
      }

      /*
       * On ajoute également le destinataire
       * dans les amis de l'expéditeur.
       */

      const { error: erreur2 } = await supabase
        .from("amis")
        .insert({
  userid: demande.expediteur_id,
  ami_id: user.id,
});

      if (erreur2) {
        if (
          !String(erreur2.message || "")
            .toLowerCase()
            .includes("duplicate")
        ) {
          throw erreur2;
        }
      }

      /*
       * La demande n'est plus en attente.
       */

      const { error: erreurDemande } =
        await supabase
          .from("demandes_amis")
          .update({
            statut: "acceptee",
          })
          .eq("id", demande.id);

      if (erreurDemande) {
        throw erreurDemande;
      }

      /*
       * On recharge tout.
       */

      await chargerDonnees();
    } catch (error) {
      console.error(
        "Erreur acceptation demande :",
        error
      );

      alert(
        "Impossible d'accepter cette demande."
      );
    } finally {
      setTraitementDemande(null);
    }
  }

  /* =========================================================
     REFUSER UNE DEMANDE
     ========================================================= */

  async function refuserDemande(demande) {
    if (traitementDemande) return;

    setTraitementDemande(demande.id);

    try {
      const { error } = await supabase
        .from("demandes_amis")
        .update({
          statut: "refusee",
        })
        .eq("id", demande.id);

      if (error) {
        throw error;
      }

      setDemandes((anciennes) =>
        anciennes.filter(
          (ancienne) =>
            ancienne.id !== demande.id
        )
      );
    } catch (error) {
      console.error(
        "Erreur refus demande :",
        error
      );

      alert(
        "Impossible de refuser cette demande."
      );
    } finally {
      setTraitementDemande(null);
    }
  }

  /* =========================================================
     CHARGEMENT
     ========================================================= */

  if (chargement) {
    return (
      <div className="container amisPage">
        <p>Chargement...</p>
      </div>
    );
  }

  /* =========================================================
     PAGE
     ========================================================= */

  return (
    <div className="container amisPage">

      {/* HEADER */}

      <div className="amisPageHeader">

        <div>

          <div className="amisSurTitre">
            CINERANK · SOCIAL
          </div>

          <h1 className="amisTitre">
            👥 Mes amis
          </h1>

          <p className="amisSousTitre">
            Retrouve tes amis et compare vos films.
          </p>

        </div>

        <button
          className="amisAjouterButton"
          onClick={() =>
            navigate("/amis/ajouter")
          }
        >
          ＋ Ajouter un ami
        </button>

      </div>


      {/* =====================================================
          DEMANDES D'AMIS
          ===================================================== */}

      {demandes.length > 0 && (

        <div className="amisBloc demandesAmisBloc">

          <div className="amisBlocHeader">

            <div>

              <h2>
                🔔 Demandes d'amis
              </h2>

              <span>
                {demandes.length} demande
                {demandes.length > 1 ? "s" : ""}
                {" "}en attente
              </span>

            </div>

          </div>


          <div className="card demandesAmisListe">

            {demandes.map((demande) => (

              <div
                className="demandeAmiLigne"
                key={demande.id}
              >

                <div className="amiIdentite">

                  <div className="amiAvatar">

                    {demande.avatar_url ? (

                      <img
                        src={demande.avatar_url}
                        alt={demande.pseudo}
                      />

                    ) : (

                      demande.pseudo
                        ?.charAt(0)
                        .toUpperCase() || "?"

                    )}

                  </div>


                  <div className="amiInfos">

                    <strong>
                      {demande.pseudo}
                    </strong>

                    <span>
                      souhaite devenir ton ami
                    </span>

                  </div>

                </div>


                <div className="demandeAmiActions">

                  <button
                    className="demandeAccepter"
                    disabled={
                      traitementDemande ===
                      demande.id
                    }
                    onClick={() =>
                      accepterDemande(
                        demande
                      )
                    }
                  >
                    ✓ Accepter
                  </button>


                  <button
                    className="demandeRefuser"
                    disabled={
                      traitementDemande ===
                      demande.id
                    }
                    onClick={() =>
                      refuserDemande(
                        demande
                      )
                    }
                  >
                    ✕ Refuser
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>

      )}


      {/* =====================================================
          LISTE DES AMIS
          ===================================================== */}

      <div className="amisBloc">

        <div className="amisBlocHeader">

          <div>

            <h2>
              👥 Mes amis
            </h2>

            <span>
              {amis.length} ami
              {amis.length > 1 ? "s" : ""}
            </span>

          </div>

        </div>


        <div className="card amisListe">

          {amis.length === 0 ? (

            <div className="amisEtatVide">

              <span>
                👥
              </span>

              <div>

                <strong>
                  Tu n'as pas encore d'amis.
                </strong>

                <p>
                  Clique sur « Ajouter un ami »
                  pour rechercher quelqu'un.
                </p>

              </div>

            </div>

          ) : (

            amis.map((ami) => (

              <div
                className="amiLigne"
                key={ami.id}
                onClick={() =>
                  navigate(`/ami/${ami.id}`)
                }
              >

                <div className="amiIdentite">

                  <div className="amiAvatar">

                    {ami.avatar_url ? (

                      <img
                        src={ami.avatar_url}
                        alt={ami.pseudo}
                      />

                    ) : (

                      ami.pseudo
                        ?.charAt(0)
                        .toUpperCase() || "?"

                    )}

                  </div>


                  <div className="amiInfos">

                    <strong>
                      {ami.pseudo}
                    </strong>

                    <span>
                      Ami CineRank
                    </span>

                  </div>

                </div>


                <div className="amiAction">
                  →
                </div>

              </div>

            ))

          )}

        </div>

      </div>

    </div>
  );
}

export default Amis;