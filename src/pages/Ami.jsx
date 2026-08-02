import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabase/client";


/* =========================================================
   COULEUR DES NOTES CINERANK
   ========================================================= */

function couleurNote(note) {

  note = Number(note || 0);

  if (note === 20) {
    return "#ff1493";
  }

  if (note <= 5) {

    const t = note / 5;

    return `rgb(
      ${Math.round(60 + t * 80)},
      0,
      0
    )`;
  }

  if (note <= 7) {

    const t = (note - 5) / 2;

    return `rgb(
      ${Math.round(140 + t * 115)},
      0,
      0
    )`;
  }

  if (note <= 9) {

    const t = (note - 7) / 2;

    return `rgb(
      255,
      ${Math.round(70 + t * 70)},
      0
    )`;
  }

  if (note <= 10.5) {

    const t = (note - 9) / 1.5;

    return `rgb(
      255,
      ${Math.round(140 + t * 70)},
      0
    )`;
  }

  if (note <= 12.5) {

    const t = (note - 10.5) / 2;

    return `rgb(
      255,
      ${Math.round(210 + t * 45)},
      0
    )`;
  }

  if (note <= 14.5) {

    const t = (note - 12.5) / 2;

    return `rgb(
      ${Math.round(255 - t * 120)},
      255,
      0
    )`;
  }

  if (note <= 16.5) {

    const t = (note - 14.5) / 2;

    return `rgb(
      ${Math.round(135 - t * 55)},
      ${Math.round(255 - t * 65)},
      0
    )`;
  }

  if (note <= 17.5) {

    const t = note - 16.5;

    return `rgb(
      ${Math.round(80 - t * 80)},
      ${Math.round(190 - t * 50)},
      0
    )`;
  }

  if (note <= 18.5) {

    const t = note - 17.5;

    return `rgb(
      0,
      ${Math.round(140 + t * 115)},
      255
    )`;
  }

  if (note <= 19) {

    const t = (note - 18.5) / 0.5;

    return `rgb(
      0,
      ${Math.round(255 - t * 155)},
      255
    )`;
  }

  if (note <= 19.5) {

    const t = (note - 19) / 0.5;

    return `rgb(
      ${Math.round(t * 120)},
      0,
      255
    )`;
  }

  const t = (note - 19.5) / 0.5;

  return `rgb(
    255,
    ${Math.round(t * 20)},
    ${Math.round(255 - t * 108)}
  )`;
}


/* =========================================================
   COULEUR NOTE SPECTATEURS
   ========================================================= */

function couleurImdb(note) {

  note = Number(note || 0);

  if (note >= 90) {
    return "#ff008c";
  }

  if (note <= 30) {
    return "#ff0000";
  }

  if (note <= 50) {

    const t = (note - 30) / 20;

    return `rgb(
      255,
      ${Math.round(80 + t * 120)},
      0
    )`;
  }

  if (note <= 70) {

    const t = (note - 50) / 20;

    return `rgb(
      255,
      200,
      ${Math.round(t * 50)}
    )`;
  }

  if (note <= 85) {

    const t = (note - 70) / 15;

    return `rgb(
      ${Math.round(170 - t * 100)},
      255,
      0
    )`;
  }

  const t = (note - 85) / 15;

  return `rgb(
    0,
    255,
    ${Math.round(80 + t * 170)}
  )`;
}


/* =========================================================
   NORMALISATION DES TITRES
   ========================================================= */

function normaliserTitre(titre) {

  return String(titre || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

}


/* =========================================================
   NOTE SUR 100
   ========================================================= */

function noteSur100(note) {

  return Math.round(
    Number(note || 0) * 5
  );

}


/* =========================================================
   MOYENNE
   ========================================================= */

function moyenneTableau(tableau) {

  if (!tableau.length) {
    return 0;
  }

  return tableau.reduce(
    (total, valeur) => total + valeur,
    0
  ) / tableau.length;

}


/* =========================================================
   CRITÈRES CINERANK
   ========================================================= */

const CRITERES = [

  ["scenario", "Scénario"],
  ["personnages", "Personnages"],
  ["realisation", "Réalisation"],
  ["ambiance", "Ambiance"],
  ["visuels", "Visuels"],
  ["musique", "Musique"],
  ["rythme", "Rythme"],
  ["impact", "Impact"],
  ["rewatch", "Rewatch"]

];


/* =========================================================
   TAILLE DU TITRE
   ========================================================= */

function TailleTitre({ titre }) {

  const [taille, setTaille] = useState(35);

  useEffect(() => {

    const longueur = String(titre || "").length;

    if (longueur <= 18) {

      setTaille(45);

    }
    else if (longueur <= 28) {

      setTaille(38);

    }
    else {

      setTaille(32);

    }

  }, [titre]);


  return (

    <h3
      style={{
        fontSize: `${taille}px`
      }}
    >
      {titre}
    </h3>

  );

}


/* =========================================================
   COMPOSANT AMI
   ========================================================= */

function Ami() {

  const navigate = useNavigate();

  const { id } = useParams();


  /* =======================================================
     ÉTATS
  ======================================================= */

  const [profil, setProfil] = useState(null);

  const [films, setFilms] = useState([]);

  const [mesFilms, setMesFilms] = useState([]);

  const [chargement, setChargement] = useState(true);


  const [vue, setVue] = useState("films");

  const [tri, setTri] = useState("note");

  const [ordre, setOrdre] = useState("desc");


  /* =======================================================
     CHARGEMENT
  ======================================================= */

  useEffect(() => {

    chargerAmi();

  }, [id]);


  async function chargerAmi() {

    setChargement(true);


    const {
      data: { user }
    } = await supabase.auth.getUser();


    if (!user) {

      navigate("/connexion");

      return;

    }


    /* =====================================================
       PROFIL AMI
    ===================================================== */

    const {
      data: profilData,
      error: profilError
    } = await supabase

      .from("profils")

      .select(
        "user_id, pseudo, avatar_url, bibliotheque_visible"
      )

      .eq("user_id", id)

      .single();


    if (profilError || !profilData) {

      console.error(
        "Erreur chargement profil ami :",
        profilError
      );

      setProfil(null);

      setChargement(false);

      return;

    }


    /* =====================================================
       CONFIDENTIALITÉ
    ===================================================== */

    if (
      profilData.bibliotheque_visible === "prive"
    ) {

      setProfil({
        ...profilData,
        bibliothequeBloquee: true
      });

      setFilms([]);

      setMesFilms([]);

      setChargement(false);

      return;

    }


    if (
      profilData.bibliotheque_visible === "amis" &&
      user.id !== id
    ) {

      const {
        data: relation,
        error: relationError
      } = await supabase

        .from("amis")

        .select("id")

        .eq("user_id", user.id)

        .eq("ami_id", id)

        .maybeSingle();


      if (relationError) {

        console.error(
          "Erreur vérification amitié :",
          relationError
        );

        setChargement(false);

        return;

      }


      if (!relation) {

        setProfil({
          ...profilData,
          bibliothequeBloquee: true
        });

        setFilms([]);

        setMesFilms([]);

        setChargement(false);

        return;

      }

    }


    setProfil(profilData);


    /* =====================================================
       FILMS DE L'AMI
    ===================================================== */

    const {
      data: filmsData,
      error: filmsError
    } = await supabase

      .from("films")

      .select("*")

      .eq("user_id", id);


    console.log("👤 ID ami :", id);

    console.log(
      "🎬 Films récupérés :",
      filmsData
    );

    console.log(
      "❌ Erreur films :",
      filmsError
    );


    if (filmsError) {

      console.error(
        "Erreur chargement films ami :",
        filmsError
      );

      setFilms([]);

    }
    else {

      setFilms(
        filmsData || []
      );

    }


    /* =====================================================
       MES FILMS
    ===================================================== */

    const {
      data: mesFilmsData,
      error: mesFilmsError
    } = await supabase

      .from("films")

      .select("*")

      .eq("user_id", user.id);


    console.log(
      "🎬 Mes films :",
      mesFilmsData
    );

    console.log(
      "❌ Erreur mes films :",
      mesFilmsError
    );


    if (mesFilmsError) {

      console.error(
        "Erreur chargement de mes films :",
        mesFilmsError
      );

      setMesFilms([]);

    }
    else {

      setMesFilms(
        mesFilmsData || []
      );

    }


    setChargement(false);

  }


  /* =======================================================
     TRI
  ======================================================= */

  function trier(categorie) {

    let nouvelOrdre = "desc";


    if (
      tri === categorie &&
      ordre === "desc"
    ) {

      nouvelOrdre = "asc";

    }


    setTri(categorie);

    setOrdre(nouvelOrdre);

  }


  /* =======================================================
     FILMS TRIÉS
  ======================================================= */

  const filmsTries = useMemo(() => {

    const copie = [...films];


    copie.sort((a, b) => {

      let valeurA;

      let valeurB;


      if (tri === "annee") {

        valeurA =
          a.dateSortie
            ? new Date(
                a.dateSortie
              ).getFullYear()
            : 0;

        valeurB =
          b.dateSortie
            ? new Date(
                b.dateSortie
              ).getFullYear()
            : 0;

      }
      else {

        valeurA =
          Number(
            a[tri] || 0
          );

        valeurB =
          Number(
            b[tri] || 0
          );

      }


      return ordre === "desc"

        ? valeurB - valeurA

        : valeurA - valeurB;

    });


    return copie;

  }, [
    films,
    tri,
    ordre
  ]);


  /* =======================================================
     NOTE MOYENNE
  ======================================================= */

  const noteMoyenne = useMemo(() => {

    if (!films.length) {
      return 0;
    }


    const total = films.reduce(
      (somme, film) =>
        somme +
        Number(
          film.note || 0
        ),
      0
    );


    return (
      total / films.length
    ) * 5;

  }, [films]);


  /* =======================================================
     FILMS EN COMMUN
  ======================================================= */

  const filmsCommuns = useMemo(() => {

    const mesFilmsMap = new Map();


    mesFilms.forEach((film) => {

      const cle =
        normaliserTitre(
          film.titre
        );


      if (!cle) {
        return;
      }


      mesFilmsMap.set(
        cle,
        film
      );

    });


    return films

      .map((filmAmi) => {

        const cle =
          normaliserTitre(
            filmAmi.titre
          );


        const monFilm =
          mesFilmsMap.get(cle);


        if (!monFilm) {
          return null;
        }


        const maNote =
          noteSur100(
            monFilm.note
          );


        const noteAmi =
          noteSur100(
            filmAmi.note
          );


        return {

          ami: filmAmi,

          moi: monFilm,

          maNote,

          noteAmi,

          ecart:
            Math.abs(
              maNote -
              noteAmi
            ),

          moyenne:
            (
              maNote +
              noteAmi
            ) / 2

        };

      })

      .filter(Boolean);

  }, [
    films,
    mesFilms
  ]);


  /* =======================================================
     COMPARAISON
  ======================================================= */

  const comparaison = useMemo(() => {

    if (!filmsCommuns.length) {

      return {

        compatibilite: 0,

        ecartMoyen: 0,

        criteres: [],

        criteresProches: [],

        criteresEloignes: [],

        filmsAccord: [],

        filmsDesaccord: [],

        plusGrosseDifference: null

      };

    }


    /* =====================================================
       CRITÈRES
    ===================================================== */

    const criteres =
      CRITERES.map(
        ([nom, label]) => {

          const valeurs = [];


          filmsCommuns.forEach(
            (film) => {

              const moi =
                noteSur100(
                  film.moi[nom]
                );


              const ami =
                noteSur100(
                  film.ami[nom]
                );


              if (
                film.moi[nom] != null &&
                film.ami[nom] != null
              ) {

                valeurs.push({

                  moi,

                  ami,

                  ecart:
                    Math.abs(
                      moi - ami
                    )

                });

              }

            }
          );


          const ecartMoyen =
            moyenneTableau(
              valeurs.map(
                (v) => v.ecart
              )
            );


          return {

            nom,

            label,

            ecartMoyen,

            compatibilite:
              Math.max(
                0,
                100 - ecartMoyen
              )

          };

        }
      );


    /* =====================================================
       COMPATIBILITÉ GLOBALE
    ===================================================== */

    const ecartFilms =
      moyenneTableau(
        filmsCommuns.map(
          (film) =>
            film.ecart
        )
      );


    const compatibilite =
      Math.max(
        0,
        Math.min(
          100,
          100 - ecartFilms
        )
      );


    /* =====================================================
       ACCORDS
    ===================================================== */

    const filmsAccord =
      [...filmsCommuns]
        .sort(
          (a, b) =>
            a.ecart -
            b.ecart
        )
        .slice(0, 5);


    /* =====================================================
       DÉSACCORDS
    ===================================================== */

    const filmsDesaccord =
      [...filmsCommuns]
        .sort(
          (a, b) =>
            b.ecart -
            a.ecart
        )
        .slice(0, 5);


    /* =====================================================
       CRITÈRES PROCHES / ÉLOIGNÉS
    ===================================================== */

    const criteresTries =
      [...criteres]
        .sort(
          (a, b) =>
            a.ecartMoyen -
            b.ecartMoyen
        );


    return {

      compatibilite:
        Math.round(
          compatibilite
        ),

      ecartMoyen:
        Math.round(
          ecartFilms * 10
        ) / 10,

      criteres,

      criteresProches:
        criteresTries.slice(0, 3),

      criteresEloignes:
        criteresTries
          .slice(-3)
          .reverse(),

      filmsAccord,

      filmsDesaccord,

      plusGrosseDifference:
        criteresTries.length
          ? criteresTries[
              criteresTries.length - 1
            ]
          : null

    };

  }, [filmsCommuns]);


  /* =======================================================
     FILMS DE L'AMI À RECOMMANDER
  ======================================================= */

  const filmsAmiARecommander =
    useMemo(() => {

      const mesTitres =
        new Set(
          mesFilms.map(
            (film) =>
              normaliserTitre(
                film.titre
              )
          )
        );


      return films

        .filter(
          (film) =>
            !mesTitres.has(
              normaliserTitre(
                film.titre
              )
            )
        )

        .filter(
          (film) =>
            Number(
              film.note || 0
            ) >= 15
        )

        .sort(
          (a, b) =>
            Number(
              b.note || 0
            ) -
            Number(
              a.note || 0
            )
        )

        .slice(0, 8);

    }, [
      films,
      mesFilms
    ]);


  /* =======================================================
     MES FILMS À RECOMMANDER
  ======================================================= */

  const mesFilmsARecommander =
    useMemo(() => {

      const titresAmi =
        new Set(
          films.map(
            (film) =>
              normaliserTitre(
                film.titre
              )
          )
        );


      return mesFilms

        .filter(
          (film) =>
            !titresAmi.has(
              normaliserTitre(
                film.titre
              )
            )
        )

        .filter(
          (film) =>
            Number(
              film.note || 0
            ) >= 15
        )

        .sort(
          (a, b) =>
            Number(
              b.note || 0
            ) -
            Number(
              a.note || 0
            )
        )

        .slice(0, 8);

    }, [
      films,
      mesFilms
    ]);


  /* =======================================================
     CHARGEMENT
  ======================================================= */

  if (chargement) {

    return (

      <div className="container amiPage">

        <p>
          Chargement...
        </p>

      </div>

    );

  }


  /* =======================================================
     PROFIL INTROUVABLE
  ======================================================= */

  if (!profil) {

    return (

      <div className="container amiPage">

        <button
          className="amiRetour"
          onClick={() =>
            navigate("/amis")
          }
        >
          ← Retour aux amis
        </button>


        <div className="card">

          <h2>
            Utilisateur introuvable
          </h2>

          <p>
            Ce profil n'existe pas ou n'est plus disponible.
          </p>

        </div>

      </div>

    );

  }


  /* =======================================================
     BIBLIOTHÈQUE PRIVÉE
  ======================================================= */

  if (profil.bibliothequeBloquee) {

    return (

      <div className="container amiPage">

        <div className="amiPageHeader">

          <div className="amiProfil">

            <div className="amiAvatarGrand">

              {profil.avatar_url ? (

                <img
                  src={profil.avatar_url}
                  alt={profil.pseudo}
                />

              ) : (

                <span>
                  {profil.pseudo
                    ?.charAt(0)
                    .toUpperCase() || "?"}
                </span>

              )}

            </div>


            <div>

              <div className="amisSurTitre">
                CINERANK · PROFIL
              </div>

              <h1 className="amiTitre">
                {profil.pseudo}
              </h1>

            </div>

          </div>


          <button
            className="amiRetour"
            onClick={() =>
              navigate("/amis")
            }
          >
            ← Retour
          </button>

        </div>


        <div className="card amisEtatVide">

          <span>
            🔒
          </span>

          <div>

            <strong>
              Bibliothèque privée
            </strong>

            <p>
              {profil.pseudo} ne permet pas
              actuellement de voir ses films.
            </p>

          </div>

        </div>

      </div>

    );

  }


  /* =======================================================
     AFFICHAGE
  ======================================================= */

  return (

    <div className="container amiPage">


      {/* =================================================
          HEADER PROFIL
      ================================================= */}

      <div className="amiPageHeader">

        <div className="amiProfil">

          <div className="amiAvatarGrand">

            {profil.avatar_url ? (

              <img
                src={profil.avatar_url}
                alt={profil.pseudo}
              />

            ) : (

              <span>
                {profil.pseudo
                  ?.charAt(0)
                  .toUpperCase() || "?"}
              </span>

            )}

          </div>


          <div>

            <div className="amisSurTitre">
              CINERANK · PROFIL AMI
            </div>


            <h1 className="amiTitre">
              {profil.pseudo}
            </h1>


            <p className="amiSousTitre">

              {films.length} film
              {films.length > 1 ? "s" : ""}

              {" · "}

              Note moyenne{" "}

              <strong>
                {noteMoyenne.toFixed(0)}/100
              </strong>

            </p>

          </div>

        </div>


        <button
          className="amiRetour"
          onClick={() =>
            navigate("/amis")
          }
        >
          ← Retour
        </button>

      </div>


      {/* =================================================
          NAVIGATION
      ================================================= */}

      <div className="amiNavigation">

        <button
          className={
            vue === "films"
              ? "amiNavigationButton actif"
              : "amiNavigationButton"
          }
          onClick={() =>
            setVue("films")
          }
        >
          🎬 Ses films
        </button>


        <button
          className={
            vue === "classement"
              ? "amiNavigationButton actif"
              : "amiNavigationButton"
          }
          onClick={() =>
            setVue("classement")
          }
        >
          📊 Son classement
        </button>


        <button
          className={
            vue === "comparaison"
              ? "amiNavigationButton actif comparaisonButton"
              : "amiNavigationButton comparaisonButton"
          }
          onClick={() =>
            setVue("comparaison")
          }
        >
          🤝 Comparer nos goûts
        </button>

      </div>


      {/* =================================================
          VUE FILMS
      ================================================= */}

      {vue === "films" && (

        <>

          <div className="filmsHeader">

            <div>

              <h2 className="titreFilms">
                🎬 Les films de {profil.pseudo}
              </h2>

              <span className="filmsCompteur">

                {films.length} film
                {films.length > 1 ? "s" : ""}

              </span>

            </div>

          </div>


          <div className="card filmsContainer">

            {films.length === 0 ? (

              <div className="amisEtatVide">

                <span>
                  🎬
                </span>

                <div>

                  <strong>
                    Aucun film enregistré
                  </strong>

                  <p>
                    {profil.pseudo} n'a pas encore
                    noté de film.
                  </p>

                </div>

              </div>

            ) : (

              films.map((film) => (

                <div
                  className="filmCard"
                  key={film.id}
                >

                  <div className="filmHaut">

                    <div className="filmTitre">

                      <TailleTitre
                        titre={film.titre}
                      />

                    </div>


                    <div
                      className="scoreBadge"
                      style={{
                        background:
                          couleurNote(
                            Number(
                              film.note || 0
                            )
                          )
                      }}
                    >

                      <span className="scoreEntier">

                        {Math.floor(
                          Number(
                            film.note || 0
                          ) * 5
                        )}

                      </span>

                      <span className="scoreDecimal">

                        .{Math.floor(
                          (
                            Number(
                              film.note || 0
                            ) * 5 % 1
                          ) * 10
                        )}

                      </span>

                    </div>

                  </div>


                  <div className="filmBas">

                    <div className="filmPresentation">

                      {film.poster && (

                        <img
                          className="filmPoster"
                          src={film.poster}
                          alt={film.titre}
                        />

                      )}


                      <div className="filmInfos">

                        <p>

                          📅{" "}

                          {film.dateSortie

                            ? new Date(
                                film.dateSortie
                              ).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric"
                                }
                              )

                            : "Date inconnue"

                          }

                        </p>


                        <p>

                          🎬{" "}

                          {film.realisateur ||
                            "Réalisateur inconnu"}

                        </p>


                        <div className="noteSpectateurs">

                          <div className="noteSpectateursTitre">
                            ⭐ Note Spectateurs
                          </div>


                          <div
                            className="noteSpectateursCarre"
                            style={{
                              background:
                                couleurImdb(
                                  film.imdb || 0
                                )
                            }}
                          >

                            {film.imdb

                              ? Number(
                                  film.imdb
                                ).toFixed(0)

                              : "—"

                            }

                          </div>

                        </div>

                      </div>

                    </div>


                    <div className="droiteFilm">

                      <div className="miniNotes">

                        {CRITERES.map(
                          ([nom, label]) => (

                            <div
                              className="miniNote"
                              key={nom}
                            >

                              <span>
                                {label}
                              </span>


                              <div className="miniBarreFond">

                                <div
                                  className="miniBarreValeur"
                                  style={{
                                    width:
                                      `${Number(
                                        film[nom] || 0
                                      ) * 5}%`,

                                    background:
                                      couleurNote(
                                        Number(
                                          film[nom] || 0
                                        )
                                      )
                                  }}
                                />

                              </div>

                            </div>

                          )
                        )}

                      </div>

                    </div>

                  </div>


                  <div className="actions">

                    <button
                      className="ficheButton"
                      onClick={() =>
                        navigate(
                          "/film/" +
                          film.id
                        )
                      }
                    >
                      📄 Voir la fiche
                    </button>

                  </div>

                </div>

              ))

            )}

          </div>

        </>

      )}


      {/* =================================================
          VUE CLASSEMENT
      ================================================= */}

      {vue === "classement" && (

        <>

          <div className="filmsHeader">

            <div>

              <h2 className="titreFilms">
                📊 Classement de {profil.pseudo}
              </h2>

              <span className="filmsCompteur">

                Classement personnel ·{" "}

                {films.length} film
                {films.length > 1 ? "s" : ""}

              </span>

            </div>

          </div>


          <div className="card classementCard amiClassementCard">

            <table className="classementTable">

              <thead>

                <tr>

                  <th className="filmHeader">
                    FILM
                  </th>


                  {[

                    ["note", "NOTE"],
                    ["scenario", "SCÉNARIO"],
                    ["personnages", "PERSOS"],
                    ["realisation", "RÉAL"],
                    ["ambiance", "AMB"],
                    ["visuels", "VISU"],
                    ["musique", "MUSIQUE"],
                    ["rythme", "RYTHME"],
                    ["impact", "IMPACT"],
                    ["rewatch", "REWATCH"]

                  ].map(
                    ([categorie, label]) => (

                      <th
                        key={categorie}
                        className={
                          tri === categorie
                            ? "activeSort"
                            : ""
                        }
                        onClick={() =>
                          trier(categorie)
                        }
                      >

                        {label}

                        {tri === categorie && (

                          <span className="sortArrow">

                            {ordre === "desc"
                              ? "↓"
                              : "↑"}

                          </span>

                        )}

                      </th>

                    )
                  )}

                </tr>

              </thead>


              <tbody>

                {filmsTries.map(
                  (film, index) => (

                    <tr
                      key={film.id}
                      onClick={() =>
                        navigate(
                          "/film/" +
                          film.id
                        )
                      }
                      style={{
                        cursor: "pointer"
                      }}
                    >

                      <td className="filmCell">

                        <div className="filmClassement">

                          <div className="classementPosition">
                            {index + 1}
                          </div>


                          {film.poster && (

                            <img
                              src={film.poster}
                              className="miniPoster"
                              alt={film.titre}
                            />

                          )}


                          <div className="filmClassementInfos">

                            <span className="filmClassementTitre">
                              {film.titre}
                            </span>


                            <span className="filmClassementMeta">

                              {film.dateSortie

                                ? new Date(
                                    film.dateSortie
                                  ).getFullYear()

                                : "—"

                              }

                            </span>

                          </div>

                        </div>

                      </td>


                      <td>

                        <div
                          className={
                            "petiteNote notePrincipale " +
                            (
                              tri === "note"
                                ? "noteActive"
                                : ""
                            )
                          }
                          style={{
                            background:
                              couleurNote(
                                Number(
                                  film.note || 0
                                )
                              )
                          }}
                        >

                          {Math.floor(
                            Number(
                              film.note || 0
                            ) * 5
                          )}

                        </div>

                      </td>


                      {CRITERES.map(
                        ([categorie]) => (

                          <td
                            key={categorie}
                          >

                            <div
                              className={
                                "petiteNote " +
                                (
                                  tri === categorie
                                    ? "noteActive"
                                    : ""
                                )
                              }
                              style={{
                                background:
                                  couleurNote(
                                    Number(
                                      film[
                                        categorie
                                      ] || 0
                                    )
                                  )
                              }}
                            >

                              {film[categorie] != null
  ? noteSur100(film[categorie])
  : "—"}

                            </div>

                          </td>

                        )
                      )}

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </>

      )}


      {/* =================================================
          VUE COMPARAISON
      ================================================= */}

      {vue === "comparaison" && (

        <div className="amiComparaison">


          {/* =================================================
              HEADER COMPARAISON
          ================================================= */}

          <div className="amiComparaisonHeader">

            <div>

              <div className="amisSurTitre">
                CINERANK · COMPATIBILITÉ
              </div>

              <h2 className="amiComparaisonTitre">
                🤝 Comparer nos goûts
              </h2>

              <p className="amiComparaisonSousTitre">

                Compare tes notes avec celles de{" "}

                <strong>
                  {profil.pseudo}
                </strong>{" "}

                et découvre à quel point vous aimez
                les mêmes films.

              </p>

            </div>


            <div className="amiCompatibiliteBadge">

              <span>
                COMPATIBILITÉ
              </span>

              <strong>
                {comparaison.compatibilite}%
              </strong>

            </div>

          </div>


          {/* =================================================
              STATS
          ================================================= */}

          <div className="amiComparaisonStats">

            <div className="amiComparaisonStat">

              <span>
                🎬
              </span>

              <div>

                <small>
                  Films en commun
                </small>

                <strong>
                  {filmsCommuns.length}
                </strong>

              </div>

            </div>


            <div className="amiComparaisonStat">

              <span>
                ⭐
              </span>

              <div>

                <small>
                  Écart moyen
                </small>

                <strong>
                  {comparaison.ecartMoyen} pts
                </strong>

              </div>

            </div>


            <div className="amiComparaisonStat">

              <span>
                🎯
              </span>

              <div>

                <small>
                  Films analysés
                </small>

                <strong>
                  {filmsCommuns.length}
                </strong>

              </div>

            </div>


            <div className="amiComparaisonStat">

              <span>
                📚
              </span>

              <div>

                <small>
                  Films à découvrir
                </small>

                <strong>
                  {filmsAmiARecommander.length}
                </strong>

              </div>

            </div>

          </div>


          {/* =================================================
              PAS DE FILMS COMMUNS
          ================================================= */}

          {filmsCommuns.length === 0 ? (

            <div className="card amisEtatVide amiComparaisonVide">

              <span>
                🎬
              </span>

              <div>

                <strong>
                  Pas encore assez de films en commun
                </strong>

                <p>

                  Note quelques films que{" "}
                  {profil.pseudo}
                  {" "}a également notés pour débloquer
                  l'analyse de compatibilité.

                </p>

              </div>

            </div>

          ) : (

            <>


              {/* =================================================
                  ANALYSE GLOBALE
              ================================================= */}

              <div className="amiCompatibiliteCard">

                <div className="amiCompatibiliteCardHeader">

                  <div>

                    <span>
                      ANALYSE GLOBALE
                    </span>

                    <h3>
                      Compatibilité cinématographique
                    </h3>

                  </div>


                  <div
                    className="amiCompatibiliteScore"
                    style={{
                      background:
                        couleurNote(
                          comparaison.compatibilite / 5
                        )
                    }}
                  >

                    {comparaison.compatibilite}%

                  </div>

                </div>


                <div className="amiCompatibiliteBarreFond">

                  <div
                    className="amiCompatibiliteBarre"
                    style={{
                      width:
                        `${comparaison.compatibilite}%`,

                      background:
                        couleurNote(
                          comparaison.compatibilite / 5
                        )
                    }}
                  />

                </div>


                <p className="amiCompatibilitePhrase">

                  {comparaison.compatibilite >= 90

                    ? "Vous avez clairement des goûts ciné extrêmement proches. Vous pourriez presque choisir vos films les yeux fermés."

                    : comparaison.compatibilite >= 80

                    ? "Très grosse compatibilité. Vous avez globalement les mêmes goûts et vos notes sont souvent proches."

                    : comparaison.compatibilite >= 70

                    ? "Bonne compatibilité. Vous aimez beaucoup de choses en commun, même si certaines différences commencent à apparaître."

                    : comparaison.compatibilite >= 55

                    ? "Vos goûts se croisent régulièrement, mais vous avez aussi quelques divergences assez nettes."

                    : "Vos goûts sont assez différents. Et justement, ça peut rendre vos recommandations beaucoup plus intéressantes."

                  }

                </p>

              </div>


              {/* =================================================
                  FILMS EN COMMUN
              ================================================= */}

              <div className="amiComparaisonSection">

                <div className="amiComparaisonSectionHeader">

                  <div>

                    <span>
                      🎬 FILMS EN COMMUN
                    </span>

                    <h3>
                      Vos films communs
                    </h3>

                  </div>

                  <small>

                    {filmsCommuns.length} film
                    {filmsCommuns.length > 1 ? "s" : ""}

                  </small>

                </div>


                <div className="amiFilmsCommuns">

                  {[...filmsCommuns]

                    .sort(
                      (a, b) =>
                        b.moyenne -
                        a.moyenne
                    )

                    .map(
                      (film) => (

                        <div
                          className="amiFilmCommun"
                          key={film.ami.id}
                        >

                          <div className="amiFilmCommunPoster">

                            {film.ami.poster ? (

                              <img
                                src={film.ami.poster}
                                alt={film.ami.titre}
                              />

                            ) : (

                              <div>
                                🎬
                              </div>

                            )}

                          </div>


                          <div className="amiFilmCommunInfos">

                            <strong>
                              {film.ami.titre}
                            </strong>


                            <div className="amiDeuxNotes">

                              <div>

                                <span>
                                  TOI
                                </span>

                                <b
                                  style={{
                                    background:
                                      couleurNote(
                                        film.maNote / 5
                                      )
                                  }}
                                >
                                  {film.maNote}
                                </b>

                              </div>


                              <div className="amiVs">
                                VS
                              </div>


                              <div>

                                <span>
                                  {profil.pseudo
                                    .slice(0, 10)
                                    .toUpperCase()}
                                </span>

                                <b
                                  style={{
                                    background:
                                      couleurNote(
                                        film.noteAmi / 5
                                      )
                                  }}
                                >
                                  {film.noteAmi}
                                </b>

                              </div>

                            </div>


                            <div className="amiEcart">

                              <span>
                                ÉCART
                              </span>

                              <strong
                                style={{
                                  color:
                                    couleurNote(
                                      Math.max(
                                        0,
                                        20 -
                                        film.ecart / 5
                                      )
                                    )
                                }}
                              >
                                {film.ecart} points
                              </strong>

                            </div>


                            <div className="amiFilmComparaisonBarres">

                              <div>

                                <span>
                                  Toi
                                </span>

                                <div className="amiBarreFond">

                                  <div
                                    style={{
                                      width:
                                        `${film.maNote}%`,

                                      background:
                                        couleurNote(
                                          film.maNote / 5
                                        )
                                    }}
                                  />

                                </div>

                              </div>


                              <div>

                                <span>
                                  {profil.pseudo}
                                </span>

                                <div className="amiBarreFond">

                                  <div
                                    style={{
                                      width:
                                        `${film.noteAmi}%`,

                                      background:
                                        couleurNote(
                                          film.noteAmi / 5
                                        )
                                    }}
                                  />

                                </div>

                              </div>

                            </div>

                          </div>

                        </div>

                      )
                    )}

                </div>

              </div>


              {/* =================================================
                  COMPARAISON DES 9 CRITÈRES
              ================================================= */}

              <div className="amiComparaisonSection">

                <div className="amiComparaisonSectionHeader">

                  <div>

                    <span>
                      🧠 ANALYSE DES CRITÈRES
                    </span>

                    <h3>
                      Où vos goûts se rejoignent
                    </h3>

                  </div>

                </div>


                <div className="amiCriteresComparaison">

                  {CRITERES.map(
                    ([nom, label]) => {

                      const valeurs =
                        filmsCommuns.filter(
                          (film) =>
                            film.moi[nom] != null &&
                            film.ami[nom] != null
                        );


                      if (!valeurs.length) {
                        return null;
                      }


                      const moyenneMoi =
                        moyenneTableau(
                          valeurs.map(
                            (film) =>
                              noteSur100(
                                film.moi[nom]
                              )
                          )
                        );


                      const moyenneAmi =
                        moyenneTableau(
                          valeurs.map(
                            (film) =>
                              noteSur100(
                                film.ami[nom]
                              )
                          )
                        );


                      const ecart =
                        Math.abs(
                          moyenneMoi -
                          moyenneAmi
                        );


                      return (

                        <div
                          className="amiCritereComparaison"
                          key={nom}
                        >

                          <div className="amiCritereTitre">

                            <strong>
                              {label}
                            </strong>

                            <span>
                              écart {Math.round(ecart)} pts
                            </span>

                          </div>


                          <div className="amiCritereLigne">

                            <div className="amiCritereNom">
                              TOI
                            </div>

                            <div className="amiCritereBarreFond">

                              <div
                                className="amiCritereBarre"
                                style={{
                                  width:
                                    `${moyenneMoi}%`,

                                  background:
                                    couleurNote(
                                      moyenneMoi / 5
                                    )
                                }}
                              />

                            </div>

                            <strong>
                              {Math.round(
                                moyenneMoi
                              )}
                            </strong>

                          </div>


                          <div className="amiCritereLigne">

                            <div className="amiCritereNom">

                              {profil.pseudo
                                .slice(0, 8)
                                .toUpperCase()}

                            </div>

                            <div className="amiCritereBarreFond">

                              <div
                                className="amiCritereBarre"
                                style={{
                                  width:
                                    `${moyenneAmi}%`,

                                  background:
                                    couleurNote(
                                      moyenneAmi / 5
                                    )
                                }}
                              />

                            </div>

                            <strong>
                              {Math.round(
                                moyenneAmi
                              )}
                            </strong>

                          </div>

                        </div>

                      );

                    }
                  )}

                </div>

              </div>


              {/* =================================================
                  ACCORDS / DÉSACCORDS
              ================================================= */}

              <div className="amiAnalyseDeuxColonnes">


                <div className="amiAnalyseBloc">

                  <div className="amiAnalyseBlocTitre">

                    <span>
                      🏆
                    </span>

                    <div>

                      <small>
                        VOS PLUS GROS ACCORDS
                      </small>

                      <h3>
                        Vous êtes quasiment d'accord
                      </h3>

                    </div>

                  </div>


                  <div className="amiAnalyseFilms">

                    {comparaison.filmsAccord.map(
                      (film) => (

                        <div
                          className="amiAnalyseFilm"
                          key={film.ami.id}
                        >

                          {film.ami.poster && (

                            <img
                              src={film.ami.poster}
                              alt={film.ami.titre}
                            />

                          )}

                          <div>

                            <strong>
                              {film.ami.titre}
                            </strong>

                            <span>

                              Toi {film.maNote} ·{" "}

                              {profil.pseudo}{" "}
                              {film.noteAmi}

                            </span>

                          </div>

                          <b>
                            {film.ecart} pt
                          </b>

                        </div>

                      )
                    )}

                  </div>

                </div>


                <div className="amiAnalyseBloc">

                  <div className="amiAnalyseBlocTitre">

                    <span>
                      💥
                    </span>

                    <div>

                      <small>
                        VOS PLUS GROS DÉSACCORDS
                      </small>

                      <h3>
                        Là, ça commence à chauffer
                      </h3>

                    </div>

                  </div>


                  <div className="amiAnalyseFilms">

                    {comparaison.filmsDesaccord.map(
                      (film) => (

                        <div
                          className="amiAnalyseFilm"
                          key={film.ami.id}
                        >

                          {film.ami.poster && (

                            <img
                              src={film.ami.poster}
                              alt={film.ami.titre}
                            />

                          )}

                          <div>

                            <strong>
                              {film.ami.titre}
                            </strong>

                            <span>

                              Toi {film.maNote} ·{" "}

                              {profil.pseudo}{" "}
                              {film.noteAmi}

                            </span>

                          </div>

                          <b>
                            {film.ecart} pt
                          </b>

                        </div>

                      )
                    )}

                  </div>

                </div>

              </div>


              {/* =================================================
                  CRITÈRES PROCHES / ÉLOIGNÉS
              ================================================= */}

              <div className="amiAnalyseDeuxColonnes">


                <div className="amiAnalyseBloc amiCritereResume">

                  <div className="amiAnalyseBlocTitre">

                    <span>
                      ❤️
                    </span>

                    <div>

                      <small>
                        CRITÈRES LES PLUS PROCHES
                      </small>

                      <h3>
                        Vos goûts se ressemblent
                      </h3>

                    </div>

                  </div>


                  {comparaison.criteresProches.map(
                    (critere) => (

                      <div
                        className="amiCritereResumeLigne"
                        key={critere.nom}
                      >

                        <strong>
                          {critere.label}
                        </strong>

                        <span>

                          {Math.round(
                            critere.compatibilite
                          )}%

                        </span>

                      </div>

                    )
                  )}

                </div>


                <div className="amiAnalyseBloc amiCritereResume">

                  <div className="amiAnalyseBlocTitre">

                    <span>
                      ⚡
                    </span>

                    <div>

                      <small>
                        CRITÈRES LES PLUS ÉLOIGNÉS
                      </small>

                      <h3>
                        Vos goûts divergent
                      </h3>

                    </div>

                  </div>


                  {comparaison.criteresEloignes.map(
                    (critere) => (

                      <div
                        className="amiCritereResumeLigne"
                        key={critere.nom}
                      >

                        <strong>
                          {critere.label}
                        </strong>

                        <span>

                          écart{" "}

                          {Math.round(
                            critere.ecartMoyen
                          )} pts

                        </span>

                      </div>

                    )
                  )}

                </div>

              </div>


              {/* =================================================
                  RECOMMANDATIONS DE L'AMI
              ================================================= */}

              <div className="amiComparaisonSection">

                <div className="amiComparaisonSectionHeader">

                  <div>

                    <span>
                      🍿 RECOMMANDATIONS
                    </span>

                    <h3>
                      Vous devriez regarder...
                    </h3>

                  </div>

                </div>


                <div className="amiRecoIntro">

                  <div>
                    🎯
                  </div>

                  <p>

                    {profil.pseudo} a noté très haut
                    des films que tu n'as pas encore
                    notés. Voilà ceux qui semblent les
                    plus intéressants à découvrir.

                  </p>

                </div>


                {filmsAmiARecommander.length === 0 ? (

                  <div className="amisEtatVide">

                    <span>
                      🎬
                    </span>

                    <div>

                      <strong>
                        Aucun nouveau film à recommander
                      </strong>

                      <p>

                        Vous avez déjà beaucoup de films
                        en commun ou {profil.pseudo} n'a
                        pas encore assez de films très bien
                        notés hors de ta bibliothèque.

                      </p>

                    </div>

                  </div>

                ) : (

                  <div className="amiRecoFilms">

                    {filmsAmiARecommander.map(
                      (film) => (

                        <div
                          className="amiRecoFilm"
                          key={film.id}
                          onClick={() =>
                            navigate(
                              "/film/" +
                              film.id
                            )
                          }
                        >

                          {film.poster ? (

                            <img
                              src={film.poster}
                              alt={film.titre}
                            />

                          ) : (

                            <div className="amiRecoPosterVide">
                              🎬
                            </div>

                          )}


                          <div className="amiRecoInfos">

                            <strong>
                              {film.titre}
                            </strong>

                            <span>

                              {film.dateSortie

                                ? new Date(
                                    film.dateSortie
                                  ).getFullYear()

                                : "—"

                              }

                            </span>

                            <small>
                              Note de {profil.pseudo}
                            </small>

                            <b
                              style={{
                                background:
                                  couleurNote(
                                    Number(
                                      film.note || 0
                                    )
                                  )
                              }}
                            >

                              {noteSur100(
                                film.note
                              )}

                            </b>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>


              {/* =================================================
                  MES RECOMMANDATIONS POUR L'AMI
              ================================================= */}

              <div className="amiComparaisonSection">

                <div className="amiComparaisonSectionHeader">

                  <div>

                    <span>
                      🎯 À TON TOUR
                    </span>

                    <h3>
                      Tes films qu'il devrait voir
                    </h3>

                  </div>

                </div>


                {mesFilmsARecommander.length === 0 ? (

                  <div className="amisEtatVide">

                    <span>
                      🎬
                    </span>

                    <div>

                      <strong>
                        Rien à recommander pour l'instant
                      </strong>

                      <p>

                        Aucun de tes films très bien notés
                        ne manque encore à la bibliothèque
                        de {profil.pseudo}.

                      </p>

                    </div>

                  </div>

                ) : (

                  <div className="amiRecoFilms">

                    {mesFilmsARecommander.map(
                      (film) => (

                        <div
                          className="amiRecoFilm"
                          key={film.id}
                          onClick={() =>
                            navigate(
                              "/film/" +
                              film.id
                            )
                          }
                        >

                          {film.poster ? (

                            <img
                              src={film.poster}
                              alt={film.titre}
                            />

                          ) : (

                            <div className="amiRecoPosterVide">
                              🎬
                            </div>

                          )}


                          <div className="amiRecoInfos">

                            <strong>
                              {film.titre}
                            </strong>

                            <span>

                              {film.dateSortie

                                ? new Date(
                                    film.dateSortie
                                  ).getFullYear()

                                : "—"

                              }

                            </span>

                            <small>
                              Ta note
                            </small>

                            <b
                              style={{
                                background:
                                  couleurNote(
                                    Number(
                                      film.note || 0
                                    )
                                  )
                              }}
                            >

                              {noteSur100(
                                film.note
                              )}

                            </b>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>

            </>

          )}

        </div>

      )}

    </div>

  );

}


export default Ami;