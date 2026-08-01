import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";
import { cpiUS } from "../data/cpiUS";
import {
  chercherFilmsGlobaux,
  synchroniserFilmsGlobaux
} from "../api/tmdb";

/* =========================================================
   NOTE
   ========================================================= */

function couleurNote(note) {
  if (note === 20) return "#ff1493";

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
   NOTE SPECTATEUR
   ========================================================= */

function couleurImdb(note) {
  if (note >= 90) return "#ff008c";

  if (note <= 30) return "#ff0000";

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
   EXTRACTION DES MONTANTS
   ========================================================= */

function montantNombre(valeur) {
  if (valeur === null || valeur === undefined) {
    return null;
  }

  const texte = String(valeur)
    .replace(/\s/g, "")
    .replace(/,/g, "")
    .replace(/[^0-9.-]/g, "");

  const nombre = Number(texte);

  return Number.isFinite(nombre) && nombre > 0
    ? nombre
    : null;
}


/* =========================================================
   ANNÉE
   ========================================================= */

function obtenirAnnee(dateSortie) {
  if (!dateSortie) {
    return null;
  }

  const annee = new Date(dateSortie).getFullYear();

  return Number.isFinite(annee)
    ? annee
    : null;
}


/* =========================================================
   INFLATION
   ========================================================= */

function ajusterInflation(montant, dateSortie) {
  if (!montant || !dateSortie) {
    return null;
  }

  const annee = obtenirAnnee(dateSortie);

  if (!annee) {
    return null;
  }

  const cpiFilm = cpiUS[annee];
  const cpiActuel = cpiUS[2026];

  if (!cpiFilm || !cpiActuel) {
    return null;
  }

  return montant * (cpiActuel / cpiFilm);
}


/* =========================================================
   POURCENTAGE DE RENTABILITÉ
   ========================================================= */

function calculerRentabilite(budget, boxOffice) {
  if (!budget || !boxOffice) {
    return null;
  }

  const budgetNombre = montantNombre(budget);
  const boxOfficeNombre = montantNombre(boxOffice);

  if (!budgetNombre || !boxOfficeNombre) {
    return null;
  }

  let marketing;

  if (budgetNombre < 50_000_000) {
    marketing = budgetNombre * 0.35;
  }
  else if (budgetNombre < 100_000_000) {
    marketing = budgetNombre * 0.45;
  }
  else if (budgetNombre < 150_000_000) {
    marketing = budgetNombre * 0.50;
  }
  else if (budgetNombre < 200_000_000) {
    marketing = budgetNombre * 0.55;
  }
  else {
    marketing = budgetNombre * 0.60;
  }

  const recettesStudio = boxOfficeNombre * 0.50;

  const investissementTotal =
    budgetNombre + marketing;

  const benefice =
    recettesStudio - investissementTotal;

  const pourcentage =
    investissementTotal > 0
      ? (benefice / investissementTotal) * 100
      : null;

  return {
    benefice,
    pourcentage,
    marketing,
    investissementTotal
  };
}


/* =========================================================
   COULEUR RENTABILITÉ
   ========================================================= */

/*
   IMPORTANT :

   Cette couleur ne dépend PLUS du plus gros bénéfice
   de la liste.

   Les seuils sont fixes.
*/

function couleurRentabilite(valeur) {
  if (
    valeur === null ||
    valeur === undefined ||
    !Number.isFinite(valeur)
  ) {
    return "#777";
  }

  /* =========================
     PERTES
     ========================= */

  if (valeur < 0) {

    if (valeur <= -500_000_000) {
      return "#8b0000";
    }

    if (valeur <= -100_000_000) {
      return "#dc2626";
    }

    return "#f87171";
  }


  /* =========================
     ZÉRO
     ========================= */

  if (valeur === 0) {
    return "#777";
  }


  /* =========================
     BÉNÉFICES
     ========================= */

  if (valeur < 100_000_000) {
    return "#86efac";
  }

  if (valeur < 500_000_000) {
    return "#22c55e";
  }

  return "#15803d";
}


/* =========================================================
   COULEUR POURCENTAGE
   ========================================================= */

function couleurPourcentage(valeur) {
  if (
    valeur === null ||
    valeur === undefined ||
    !Number.isFinite(valeur)
  ) {
    return "#777";
  }

  /* =========================
     PERTES
     ========================= */

  if (valeur <= -100) {
    return "#8b0000";
  }

  if (valeur <= -50) {
    return "#dc2626";
  }

  if (valeur < 0) {
    return "#f87171";
  }


  /* =========================
     ZÉRO
     ========================= */

  if (valeur === 0) {
    return "#777";
  }


  /* =========================
     POSITIF
     ========================= */

  if (valeur < 25) {
    return "#86efac";
  }

  if (valeur < 50) {
    return "#4ade80";
  }

  if (valeur < 100) {
    return "#22c55e";
  }

  if (valeur < 200) {
    return "#16a34a";
  }

  return "#15803d";
}


/* =========================================================
   FORMAT ARGENT
   ========================================================= */

function formaterMillions(valeur) {
  if (valeur === null || valeur === undefined) {
    return "—";
  }

  const millions = valeur / 1_000_000;

  return `${millions.toLocaleString("fr-FR", {
    maximumFractionDigits: 1
  })} M$`;
}


/* =========================================================
   FORMAT POURCENTAGE
   ========================================================= */

function formaterPourcentage(valeur) {
  if (valeur === null || valeur === undefined) {
    return "—";
  }

  const signe = valeur > 0 ? "+" : "";

  return `${signe}${valeur.toLocaleString("fr-FR", {
    maximumFractionDigits: 0
  })} %`;
}


/* =========================================================
   COMPOSANT
   ========================================================= */

function Classement() {

  const navigate = useNavigate();

  const classementGlobal =
    window.location.pathname === "/classement-global";


  const [films, setFilms] = useState([]);

  const [vue, setVue] = useState(
    classementGlobal
      ? "chiffres"
      : "notes"
  );

  const [inflation, setInflation] = useState(false);

  const [recherche, setRecherche] = useState("");

  const [page, setPage] = useState(1);
const [totalPagesGlobal, setTotalPagesGlobal] = useState(1);

const FILMS_PAR_PAGE = 25;

/*
  Pour le classement global, on charge plusieurs pages TMDB
  afin que le tri puisse porter sur un vrai catalogue,
  et pas uniquement sur les 20 films actuellement affichés.
*/
const [filmsGlobauxCharges, setFilmsGlobauxCharges] = useState(false);


  const [triNotes, setTriNotes] = useState(null);
  const [ordreNotes, setOrdreNotes] = useState("desc");

  const [triChiffres, setTriChiffres] = useState(null);
  const [ordreChiffres, setOrdreChiffres] = useState("desc");


  /* =====================================================
     RECHERCHE
     ===================================================== */

  function changerRecherche(valeur) {
    setRecherche(valeur);
    setPage(1);
  }


  /* =====================================================
     CHARGEMENT
     ===================================================== */

  useEffect(() => {

    if (classementGlobal) {
      setVue("chiffres");
      chargerFilmsGlobauxTMDB(1);
    }
    else {
      chargerFilms();
    }

  }, [classementGlobal]);


  /* =====================================================
     CHARGEMENT GLOBAL
     ===================================================== */

  async function chargerFilmsGlobauxTMDB() {

  try {

    const pagesACharger = 500;
    const taillePaquet = 5;

    let tousLesFilms = [];


    for (
      let debut = 1;
      debut <= pagesACharger;
      debut += taillePaquet
    ) {

      const pages = Array.from(
        {
          length: Math.min(
            taillePaquet,
            pagesACharger - debut + 1
          )
        },
        (_, index) => debut + index
      );


      const resultats = await Promise.all(

        pages.map(
          numeroPage =>
            chercherFilmsGlobaux(numeroPage)
        )

      );


      resultats.forEach(resultat => {

        if (resultat?.films) {

          tousLesFilms.push(
            ...resultat.films
          );

        }

      });


      /*
       * On retire les doublons.
       */

      tousLesFilms =
        Array.from(

          new Map(
            tousLesFilms.map(
              film => [film.id, film]
            )
          ).values()

        );


      /*
       * On met à jour progressivement le classement.
       */

      setFilms(tousLesFilms);

try {
  await synchroniserFilmsGlobaux(tousLesFilms);
}
catch (error) {
  console.error(
    "ERREUR SAUVEGARDE CATALOGUE GLOBAL :",
    error
  );
}

    }


    /*
     * Dernière déduplication de sécurité.
     */

    const filmsUniques =
      Array.from(

        new Map(
          tousLesFilms.map(
            film => [film.id, film]
          )
        ).values()

      );


    setFilms(
      filmsUniques
    );


    setFilmsGlobauxCharges(
      true
    );


    setPage(1);


    setTotalPagesGlobal(

      Math.max(
        1,
        Math.ceil(
          filmsUniques.length /
          FILMS_PAR_PAGE
        )
      )

    );

  }
  catch (error) {

    console.error(
      "ERREUR CHARGEMENT CLASSEMENT GLOBAL :",
      error
    );

    setFilms([]);

  }

}


  /* =====================================================
     CHARGEMENT CLASSEMENT UTILISATEUR
     ===================================================== */

  async function chargerFilms() {

    const {
      data: { user }
    } = await supabase.auth.getUser();


    if (!user) {

      navigate("/connexion");

      return;

    }


    const {
      data,
      error
    } = await supabase
      .from("films")
      .select("*")
      .eq("user_id", user.id);


    if (error) {

      console.error(
        "ERREUR CHARGEMENT FILMS :",
        error
      );

      return;

    }


    setFilms(data || []);
    setPage(1);

  }


  /* =====================================================
     FILMS FILTRÉS
     ===================================================== */

  const filmsFiltres = useMemo(() => {

    const rechercheNormalisee =
      recherche
        .trim()
        .toLowerCase();


    if (!rechercheNormalisee) {
      return films;
    }


    return films.filter((film) =>
      film.titre
        ?.toLowerCase()
        .includes(rechercheNormalisee)
    );

  }, [films, recherche]);


  /* =====================================================
     NOMBRE DE PAGES
     ===================================================== */

  const nombrePages = Math.max(
  1,
  Math.ceil(
    filmsFiltres.length / FILMS_PAR_PAGE
  )
);





  /* =====================================================
     DONNÉES CHIFFRES
     ===================================================== */

  const donneesChiffres = useMemo(() => {

    return films.map((film) => {

      const budgetBrut =
        montantNombre(film.budget);

      const boxOfficeBrut =
        montantNombre(film.boxOffice);


      const budget =
        inflation
          ? ajusterInflation(
              budgetBrut,
              film.dateSortie
            )
          : budgetBrut;


      const boxOffice =
        inflation
          ? ajusterInflation(
              boxOfficeBrut,
              film.dateSortie
            )
          : boxOfficeBrut;


      const rentabilite =
        calculerRentabilite(
          budget,
          boxOffice
        );


      return {

        ...film,

        annee:
          obtenirAnnee(
            film.dateSortie
          ),

        budgetChiffre:
          budget,

        boxOfficeChiffre:
          boxOffice,

        rentabilite:
          rentabilite?.benefice ?? null,

        pourcentage:
          rentabilite?.pourcentage ?? null

      };

    });

  }, [films, inflation]);


  /* =====================================================
     TRI NOTES
     ===================================================== */

  function trierNotes(categorie) {

    let nouvelOrdre = "desc";


    if (
      triNotes === categorie &&
      ordreNotes === "desc"
    ) {
      nouvelOrdre = "asc";
    }


    const nouveau =
      [...films].sort((a, b) => {

        const valeurA =
          Number(a[categorie] || 0);

        const valeurB =
          Number(b[categorie] || 0);


        return nouvelOrdre === "desc"
          ? valeurB - valeurA
          : valeurA - valeurB;

      });


    setFilms(nouveau);
    setTriNotes(categorie);
    setOrdreNotes(nouvelOrdre);
    setPage(1);

  }


  /* =====================================================
     TRI CHIFFRES
     ===================================================== */

  function trierChiffresPar(categorie) {

  let nouvelOrdre = "desc";

  if (
    triChiffres === categorie &&
    ordreChiffres === "desc"
  ) {
    nouvelOrdre = "asc";
  }


  const nouveau = [...films].sort((a, b) => {

    const calculerValeur = (film) => {

      const budgetBrut =
        montantNombre(film.budget);

      const boxOfficeBrut =
        montantNombre(film.boxOffice);


      const budget =
        inflation
          ? ajusterInflation(
              budgetBrut,
              film.dateSortie
            )
          : budgetBrut;


      const boxOffice =
        inflation
          ? ajusterInflation(
              boxOfficeBrut,
              film.dateSortie
            )
          : boxOfficeBrut;


      const rentabilite =
        calculerRentabilite(
          budget,
          boxOffice
        );


      switch (categorie) {

        case "imdb":
          return Number(film.imdb || 0);

        case "annee":
          return obtenirAnnee(
            film.dateSortie
          ) || 0;

        case "budget":
          return budget || 0;

        case "boxOffice":
          return boxOffice || 0;

        case "rentabilite":
  return rentabilite?.benefice ?? 0;

case "pourcentage":
  return rentabilite?.pourcentage ?? 0;

default:
  return 0;

      }

    };


    const valeurA =
      calculerValeur(a);

    const valeurB =
      calculerValeur(b);


    return nouvelOrdre === "desc"
      ? valeurB - valeurA
      : valeurA - valeurB;

  });


  setFilms(nouveau);

  setTriChiffres(categorie);

  setOrdreChiffres(nouvelOrdre);

  setPage(1);

}


  /* =====================================================
     STATS GLOBALES
     ===================================================== */

  const budgets =
    donneesChiffres
      .map(
        film =>
          film.budgetChiffre
      )
      .filter(
        valeur =>
          valeur !== null &&
          valeur !== undefined
      );


  const boxOffices =
    donneesChiffres
      .map(
        film =>
          film.boxOfficeChiffre
      )
      .filter(
        valeur =>
          valeur !== null &&
          valeur !== undefined
      );


  const rentabilitesValides =
    donneesChiffres
      .map(
        film =>
          film.rentabilite
      )
      .filter(
        valeur =>
          valeur !== null &&
          valeur !== undefined
      );


  const pourcentagesValides =
    donneesChiffres
      .map(
        film =>
          film.pourcentage
      )
      .filter(
        valeur =>
          valeur !== null &&
          valeur !== undefined
      );


  const moyenne = (tableau) => {

    if (!tableau.length) {
      return null;
    }

    return tableau.reduce(
      (total, valeur) =>
        total + valeur,
      0
    ) / tableau.length;

  };


  const budgetMoyen =
    moyenne(budgets);


  const boxOfficeMoyen =
    moyenne(boxOffices);


  const rentabiliteMoyenne =
    moyenne(rentabilitesValides);


  const pourcentageMoyen =
    moyenne(pourcentagesValides);


  /* =====================================================
     STATS NOTES
     ===================================================== */

  const noteMoyenne =
    films.length
      ? (
          films.reduce(
            (total, film) =>
              total +
              Number(
                film.note || 0
              ),
            0
          ) /
          films.length
        ) * 5
      : 0;


  const annees =
    films
      .map(
        film =>
          obtenirAnnee(
            film.dateSortie
          )
      )
      .filter(Boolean);


  const anneeMoyenne =
    annees.length
      ? Math.round(
          moyenne(annees)
        )
      : "—";


  /* =====================================================
     PAGE ACTUELLE
     ===================================================== */

  const filmsPage = useMemo(() => {

    return filmsFiltres.slice(
      (page - 1) * FILMS_PAR_PAGE,
      page * FILMS_PAR_PAGE
    );

  }, [
    filmsFiltres,
    page
  ]);


  /* =====================================================
     HEADER
     ===================================================== */

  return (

    <div className="container classementPage">


      {classementGlobal && (

        <div className="classementRecherche">

          <input
            type="text"
            placeholder="Rechercher un film..."
            value={recherche}
            onChange={(e) =>
              changerRecherche(
                e.target.value
              )
            }
          />

        </div>

      )}


      <div className="classementHeader">


        <div className="classementHeaderTitle">

          <h1 className="classementTitle">

            {vue === "notes"
              ? "Classement"
              : "Chiffres"}

          </h1>

        </div>


        <div className="classementActions">

          {!classementGlobal && (

            <>

              <button
                className={
                  "classementSwitch " +
                  (
                    vue === "notes"
                      ? "actif"
                      : ""
                  )
                }
                onClick={() =>
                  setVue("notes")
                }
              >
                ⭐ Notes
              </button>


              <button
                className={
                  "classementSwitch " +
                  (
                    vue === "chiffres"
                      ? "actif"
                      : ""
                  )
                }
                onClick={() =>
                  setVue("chiffres")
                }
              >
                💰 Chiffres
              </button>

            </>

          )}


          {classementGlobal && (

            <button
              className="classementSwitch actif"
            >
              💰 Chiffres
            </button>

          )}


          <button
            className="classementRetour"
            onClick={() =>
              navigate("/")
            }
          >
            ← Retour
          </button>

        </div>

      </div>


      {/* ==================================================
          NOTES
          ================================================== */}

      {vue === "notes" && (

        <>

          <div className="classementStats">


            <div className="classementStat">

              <span>
                FILMS DU CLASSEMENT
              </span>

              <strong>
                {filmsFiltres.length}
              </strong>

            </div>


            <div className="classementStat noteMoyenneStat">

              <span>
                NOTE MOYENNE
              </span>


              <div
                className="petiteNote notePrincipale noteMoyenneCarre"
                style={{
                  background:
                    couleurNote(
                      noteMoyenne / 5
                    )
                }}
              >
                {noteMoyenne.toFixed(0)}
              </div>

            </div>


            <div className="classementStat">

              <span>
                ANNÉE MOYENNE
              </span>

              <strong>
                {anneeMoyenne}
              </strong>

            </div>


            <div className="classementStat">

              <span>
                FILMS NOTÉS
              </span>

              <strong>

                {
                  filmsFiltres.filter(
                    film =>
                      film.note !== null &&
                      film.note !== undefined
                  ).length
                }

              </strong>

            </div>


          </div>


          <div className="card classementCard">

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
                          triNotes === categorie
                            ? "activeSort"
                            : ""
                        }
                        onClick={() =>
                          trierNotes(
                            categorie
                          )
                        }
                      >

                        {label}

                        {triNotes === categorie && (

                          <span className="sortArrow">

                            {
                              ordreNotes === "desc"
                                ? "↓"
                                : "↑"
                            }

                          </span>

                        )}

                      </th>

                    )
                  )}

                </tr>

              </thead>


              <tbody>

                {filmsPage.map(
                  (film, index) => (

                    <tr
                      key={film.id}
                      onClick={() =>
                        navigate(
                          `/film/${film.id}`
                        )
                      }
                      style={{
                        cursor: "pointer"
                      }}
                    >

                      <td className="filmCell">

                        <div className="filmClassement">

                          <div className="classementPosition">

                            {
                              (page - 1) *
                              FILMS_PAR_PAGE +
                              index +
                              1
                            }

                          </div>


                          <img
                            src={film.poster}
                            className="miniPoster"
                            alt={film.titre}
                          />


                          <div className="filmClassementInfos">

                            <span className="filmClassementTitre">
                              {film.titre}
                            </span>


                            <span className="filmClassementMeta">

                              {
                                film.dateSortie
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
                              triNotes === "note"
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

                          {
                            Math.floor(
                              Number(
                                film.note || 0
                              ) * 5
                            )
                          }

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
                        categorie => (

                          <td key={categorie}>

                            <div
                              className={
                                "petiteNote " +
                                (
                                  triNotes === categorie
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

                              {
                                film[
                                  categorie
                                ] ?? "—"
                              }

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


      {/* ==================================================
          CHIFFRES
          ================================================== */}

      {vue === "chiffres" && (

        <>

          <div className="classementStats classementStatsChiffres">


            <div className="classementStat">

              <span>
                FILMS ANALYSÉS
              </span>

              <strong>
                {filmsFiltres.length}
              </strong>

            </div>


            <div className="classementStat">

              <span>
                BUDGET MOYEN
              </span>

              <strong className="statArgent">
                {formaterMillions(
                  budgetMoyen
                )}
              </strong>

            </div>


            <div className="classementStat">

              <span>
                BOX-OFFICE MOYEN
              </span>

              <strong className="statArgent">
                {formaterMillions(
                  boxOfficeMoyen
                )}
              </strong>

            </div>


            <div className="classementStat">

              <span>
                POURCENTAGE MOYEN
              </span>

              <strong
                className={
                  pourcentageMoyen > 0
                    ? "statPositif"
                    : pourcentageMoyen < 0
                    ? "statNegatif"
                    : "statNeutre"
                }
              >
                {formaterPourcentage(
                  pourcentageMoyen
                )}
              </strong>

            </div>

          </div>


          {/* =================================================
              INFLATION
              ================================================= */}

          <div className="chiffresControls">

            <div>

              <strong>
                Valeurs financières
              </strong>

              <span>

                {
                  inflation
                    ? "Montants ajustés à l'inflation 2026"
                    : "Montants de l'époque du film"
                }

              </span>

            </div>


            <button
              className={
                "inflationToggle " +
                (
                  inflation
                    ? "active"
                    : ""
                )
              }
              onClick={() =>
                setInflation(
                  !inflation
                )
              }
            >

              <span className="inflationTogglePoint" />

              {
                inflation
                  ? "Inflation activée"
                  : "Inflation désactivée"
              }

            </button>

          </div>


          <div className="card classementCard classementChiffresCard">

            <table className="classementTable classementTableChiffres">

              <thead>

                <tr>

                  <th className="filmHeader">
                    FILM
                  </th>


                  {[
                    ["imdb", "SPECTATEURS"],
                    ["annee", "ANNÉE"],
                    ["budget", "BUDGET"],
                    ["boxOffice", "BOX-OFFICE"],
                    ["rentabilite", "RENTABILITÉ"],
                    ["pourcentage", "POURCENTAGE"]
                  ].map(
                    ([categorie, label]) => (

                      <th
                        key={categorie}
                        className={
                          triChiffres === categorie
                            ? "activeSort"
                            : ""
                        }
                        onClick={() =>
                          trierChiffresPar(
                            categorie
                          )
                        }
                      >

                        {label}

                        {triChiffres === categorie && (

                          <span className="sortArrow">

                            {
                              ordreChiffres === "desc"
                                ? "↓"
                                : "↑"
                            }

                          </span>

                        )}

                      </th>

                    )
                  )}

                </tr>

              </thead>


              <tbody>

                {donneesChiffres
                  .filter(film =>
                    filmsPage.some(
                      filmPage =>
                        filmPage.id === film.id
                    )
                  )
                  .map(
                    (film) => (

                      <tr
                        key={film.id}
                        onClick={() =>
                          navigate(
                            `/film/${film.id}`
                          )
                        }
                        style={{
                          cursor: "pointer"
                        }}
                      >

                        {/* FILM */}

                        <td className="filmCell">

                          <div className="filmClassement">

                            <div className="classementPosition">

                              {
                                filmsPage.findIndex(
                                  f =>
                                    f.id === film.id
                                ) +
                                1 +
                                (page - 1) *
                                FILMS_PAR_PAGE
                              }

                            </div>


                            <img
                              src={film.poster}
                              className="miniPoster"
                              alt={film.titre}
                            />


                            <div className="filmClassementInfos">

                              <span className="filmClassementTitre">
                                {film.titre}
                              </span>


                              <span className="filmClassementMeta">

                                {
                                  film.annee ||
                                  "—"
                                }

                              </span>

                            </div>

                          </div>

                        </td>


                        {/* SPECTATEURS */}

                        <td>

                          <div
                            className={
                              "petiteNote noteSpectateurClassement " +
                              (
                                triChiffres === "imdb"
                                  ? "noteActive"
                                  : ""
                              )
                            }
                            style={{
                              background:
                                couleurImdb(
                                  Number(
                                    film.imdb || 0
                                  )
                                )
                            }}
                          >

                            {
                              film.imdb
                                ? Number(
                                    film.imdb
                                  ).toFixed(0)
                                : "—"
                            }

                          </div>

                        </td>


                        {/* ANNÉE */}

                        <td>

                          <div
                            className="chiffreSimple"
                            style={{
                              fontSize: "1.15rem",
                              fontWeight: 700
                            }}
                          >

                            {
                              film.annee ||
                              "—"
                            }

                          </div>

                        </td>


                        {/* BUDGET */}

                        <td>

                          <div
                            className="chiffreArgent"
                            style={{
                              fontSize: "1.15rem",
                              fontWeight: 700
                            }}
                          >

                            {
                              formaterMillions(
                                film.budgetChiffre
                              )
                            }

                          </div>

                        </td>


                        {/* BOX OFFICE */}

                        <td>

                          <div
                            className="chiffreArgent"
                            style={{
                              fontSize: "1.15rem",
                              fontWeight: 700
                            }}
                          >

                            {
                              formaterMillions(
                                film.boxOfficeChiffre
                              )
                            }

                          </div>

                        </td>


                        {/* RENTABILITÉ */}

                        <td>

                          <span
                            className="chiffreRentabilite"
                            style={{
                              color:
                                couleurRentabilite(
                                  film.rentabilite
                                ),
                              fontSize: "1.15rem",
                              fontWeight: 700
                            }}
                          >

                            {
                              formaterMillions(
                                film.rentabilite
                              )
                            }

                          </span>

                        </td>


                        {/* POURCENTAGE */}

                        <td>

                          <span
                            className="chiffrePourcentage"
                            style={{
                              color:
                                couleurPourcentage(
                                  film.pourcentage
                                ),
                              fontSize: "1.15rem",
                              fontWeight: 700
                            }}
                          >

                            {
                              formaterPourcentage(
                                film.pourcentage
                              )
                            }

                          </span>

                        </td>

                      </tr>

                    )
                  )}

              </tbody>

            </table>

          </div>


          <Pagination
  page={page}
  totalPages={nombrePages}
  onPrevious={() =>
    setPage(page - 1)
  }
  onNext={() =>
    setPage(page + 1)
  }
/>

        </>

      )}

    </div>

  );

}


/* =========================================================
   PAGINATION
   ========================================================= */

function Pagination({
  page,
  totalPages,
  onPrevious,
  onNext
}) {

  const total =
    Math.max(
      1,
      totalPages || 1
    );


  return (

    <div className="classementPagination">

      <button
        disabled={page <= 1}
        onClick={onPrevious}
      >
        ←
      </button>


      <span>
        Page {page} / {total}
      </span>


      <button
        disabled={page >= total}
        onClick={onNext}
      >
        →
      </button>

    </div>

  );

}


export default Classement;