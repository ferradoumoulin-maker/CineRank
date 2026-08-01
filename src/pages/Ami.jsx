import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabase/client";


/* =========================================================
   COULEUR DES NOTES
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
   NOTE SPECTATEURS
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
   COMPOSANT
   ========================================================= */

function Ami() {

  const navigate = useNavigate();

  const { id } = useParams();


  const [profil, setProfil] = useState(null);

  const [films, setFilms] = useState([]);

  const [chargement, setChargement] = useState(true);

  const [vue, setVue] = useState("films");

  const [tri, setTri] = useState("note");

  const [ordre, setOrdre] = useState("desc");


  /* =====================================================
     CHARGEMENT
     ===================================================== */

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


    /* =================================================
       PROFIL
       ================================================= */

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


    /* =================================================
       VÉRIFICATION DE CONFIDENTIALITÉ
       ================================================= */

    if (
      profilData.bibliotheque_visible === "prive"
    ) {

      setProfil({
        ...profilData,
        bibliothequeBloquee: true
      });

      setFilms([]);

      setChargement(false);

      return;

    }


    /*
     * Si la bibliothèque est réservée aux amis,
     * on vérifie que la personne est bien dans
     * la liste d'amis du visiteur.
     */

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

        .eq("userid", user.id)

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

        setChargement(false);

        return;

      }

    }


    setProfil(profilData);


    /* =================================================
       FILMS
       ================================================= */

    const {
      data: filmsData,
      error: filmsError
    } = await supabase

      .from("films")

      .select("*")

      .eq("user_id", id)

      .order("created_at", {
        ascending: false
      });


    if (filmsError) {

      console.error(
        "Erreur chargement films ami :",
        filmsError
      );

      setFilms([]);

      setChargement(false);

      return;

    }


    setFilms(filmsData || []);

    setChargement(false);

  }


  /* =====================================================
     TRI
     ===================================================== */

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


  /* =====================================================
     FILMS TRIÉS
     ===================================================== */

  const filmsTries = useMemo(() => {

    const copie = [...films];


    copie.sort((a, b) => {

      let valeurA;
      let valeurB;


      if (tri === "annee") {

        valeurA =
          a.dateSortie
            ? new Date(a.dateSortie).getFullYear()
            : 0;

        valeurB =
          b.dateSortie
            ? new Date(b.dateSortie).getFullYear()
            : 0;

      }
      else {

        valeurA = Number(
          a[tri] || 0
        );

        valeurB = Number(
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


  /* =====================================================
     NOTE MOYENNE
     ===================================================== */

  const noteMoyenne = useMemo(() => {

    if (!films.length) {
      return 0;
    }


    const total = films.reduce(
      (somme, film) =>
        somme + Number(film.note || 0),
      0
    );


    return (
      total / films.length
    ) * 5;

  }, [films]);


  /* =====================================================
     CHARGEMENT
     ===================================================== */

  if (chargement) {

    return (

      <div className="container amiPage">

        <p>
          Chargement...
        </p>

      </div>

    );

  }


  /* =====================================================
     PROFIL INTROUVABLE
     ===================================================== */

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


  /* =====================================================
     BIBLIOTHÈQUE PRIVÉE
     ===================================================== */

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


  /* =====================================================
     AFFICHAGE
     ===================================================== */

  return (

    <div className="container amiPage">


      {/* =================================================
          HEADER
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
                {noteMoyenne.toFixed(0)}/20
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


                  {/* TITRE + NOTE */}

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
                            Number(film.note || 0)
                          )
                      }}
                    >

                      <span className="scoreEntier">

                        {Math.floor(
                          Number(film.note || 0) * 5
                        )}

                      </span>


                      <span className="scoreDecimal">

                        .{Math.floor(
                          (
                            Number(film.note || 0) * 5 % 1
                          ) * 10
                        )}

                      </span>

                    </div>


                  </div>


                  {/* INFOS */}

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


                        {[

                          ["scenario", "Scénario"],
                          ["personnages", "Personnages"],
                          ["realisation", "Réalisation"],
                          ["ambiance", "Ambiance"],
                          ["visuels", "Visuels"],
                          ["musique", "Musique"],
                          ["rythme", "Rythme"],
                          ["impact", "Impact"],
                          ["rewatch", "Rewatch"]

                        ].map(
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


                  {/* FICHE UNIQUEMENT */}

                  <div className="actions">


                    <button
                      className="ficheButton"
                      onClick={() =>
                        navigate(
                          "/film/" + film.id
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
                Classement personnel · {films.length} film
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
                          "/film/" + film.id
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


                      {[

                        "scenario",
                        "personnages",
                        "realisation",
                        "ambiance",
                        "visuels",
                        "musique",
                        "rythme",
                        "impact",
                        "rewatch"

                      ].map(
                        (categorie) => (

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

                              {film[
                                categorie
                              ] ?? "—"}

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


    </div>

  );

}


export default Ami;
