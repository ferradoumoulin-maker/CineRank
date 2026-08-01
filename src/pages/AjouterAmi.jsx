import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";

function AjouterAmi() {

  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [recherche, setRecherche] = useState("");
  const [resultats, setResultats] = useState([]);

  const [rechercheEnCours, setRechercheEnCours] =
    useState(false);


  useEffect(() => {

    verifierUtilisateur();

  }, []);


  async function verifierUtilisateur() {

    const {
      data: { user }
    } = await supabase.auth.getUser();


    if (!user) {

      navigate("/connexion");

      return;

    }


    setUser(user);

  }


  async function rechercherUtilisateur() {

    const texte = recherche.trim();


    if (!texte) {

      setResultats([]);

      return;

    }


    setRechercheEnCours(true);


    const {
      data,
      error
    } = await supabase
      .from("profils")
      .select("user_id, pseudo")
      .ilike("pseudo", `%${texte}%`)
      .limit(20);


    if (error) {

      console.error(
        "Erreur recherche utilisateur :",
        error
      );

      setResultats([]);

      setRechercheEnCours(false);

      return;

    }


    const resultatsFiltres =
      (data || []).filter(
        (profil) =>
          profil.user_id !== user?.id
      );


    setResultats(resultatsFiltres);

    setRechercheEnCours(false);

  }


  async function envoyerDemande(destinataireId) {

    if (!user) return;


    const {
      data: existante,
      error: erreurExistante
    } = await supabase
      .from("demandes_amis")
      .select("id, statut")
      .or(
        `and(expediteur_id.eq.${user.id},destinataire_id.eq.${destinataireId}),and(expediteur_id.eq.${destinataireId},destinataire_id.eq.${user.id})`
      )
      .limit(1);


    if (erreurExistante) {

      console.error(
        "Erreur vérification demande :",
        erreurExistante
      );

      alert(
        "Impossible de vérifier la demande."
      );

      return;

    }


    if (
      existante &&
      existante.length > 0
    ) {

      alert(
        "Une demande existe déjà entre vous."
      );

      return;

    }


    const {
      error
    } = await supabase
      .from("demandes_amis")
      .insert({

        expediteur_id: user.id,

        destinataire_id: destinataireId,

        statut: "en_attente"

      });


    if (error) {

      console.error(
        "Erreur envoi demande :",
        error
      );

      alert(
        "Impossible d'envoyer la demande."
      );

      return;

    }


    alert(
      "✅ Demande d'ami envoyée !"
    );


    setResultats(
      (anciens) =>
        anciens.filter(
          (profil) =>
            profil.user_id !== destinataireId
        )
    );

  }


  return (

    <div className="container ajouterAmiPage">


      {/* HEADER */}

      <div className="amisPageHeader">

        <div>

          <div className="amisSurTitre">
            CINERANK · SOCIAL
          </div>

          <h1 className="amisTitre">
            ＋ Ajouter un ami
          </h1>

          <p className="amisSousTitre">
            Recherche un utilisateur avec son pseudo.
          </p>

        </div>


        <button
          className="amisRetour"
          onClick={() =>
            navigate("/amis")
          }
        >
          ← Retour
        </button>

      </div>


      {/* RECHERCHE */}

      <div className="card amisRecherche">

        <div className="amisSectionTitre">

          <div>

            <h2>
              🔎 Rechercher un utilisateur
            </h2>

            <p>
              Entre son pseudo pour le retrouver.
            </p>

          </div>

        </div>


        <div className="amisRechercheLigne">

          <input
            type="text"
            placeholder="Rechercher un pseudo..."
            value={recherche}
            onChange={(e) =>
              setRecherche(e.target.value)
            }
            onKeyDown={(e) => {

              if (e.key === "Enter") {
                rechercherUtilisateur();
              }

            }}
          />


          <button
            onClick={rechercherUtilisateur}
          >
            🔎 Rechercher
          </button>

        </div>


        {rechercheEnCours && (

          <p className="amisRechercheMessage">
            Recherche...
          </p>

        )}


        {!rechercheEnCours &&
          recherche.trim() &&
          resultats.length === 0 && (

            <div className="amisEtatVide">

              <span>
                🔎
              </span>

              <div>

                <strong>
                  Aucun utilisateur trouvé
                </strong>

                <p>
                  Vérifie l'orthographe du pseudo.
                </p>

              </div>

            </div>

          )}


        {resultats.length > 0 && (

          <div className="amisResultats">

            {resultats.map((profil) => (

              <div
                className="amiLigne"
                key={profil.user_id}
              >

                <div className="amiIdentite">

                  <div className="amiAvatar">

                    {profil.pseudo
                      ?.charAt(0)
                      .toUpperCase() || "?"}

                  </div>


                  <div className="amiInfos">

                    <strong>
                      {profil.pseudo}
                    </strong>

                    <span>
                      Utilisateur CineRank
                    </span>

                  </div>

                </div>


                <button
                  className="amisAjouterPetit"
                  onClick={() =>
                    envoyerDemande(
                      profil.user_id
                    )
                  }
                >
                  ＋ Ajouter
                </button>

              </div>

            ))}

          </div>

        )}

      </div>


    </div>

  );

}


export default AjouterAmi;
