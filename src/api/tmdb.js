import { supabase } from "../supabase/client";

export async function synchroniserFilmsGlobaux(films) {

  console.log("=================================");
  console.log("🔵 SYNCHRONISATION SUPABASE");
  console.log("Nombre de films reçus :", films?.length);
  console.log("=================================");

  if (!films || !films.length) {
    console.warn("⚠️ Aucun film à synchroniser.");
    return;
  }

  const lignes = films.map((film) => ({

    tmdb_id: Number(film.tmdbId),

    titre: film.titre || "Titre inconnu",
    poster: film.poster || "",
    date_sortie: film.dateSortie || null,
    realisateur: film.realisateur || "Inconnu",
    synopsis: film.synopsis || "",

    // IMDb est une note sur 100
    // donc surtout PAS de Number.isInteger ici
    imdb: Number(film.imdb || 0),

    budget: film.budget || "Inconnu",

    // BIGINT → entier obligatoire
    budget_nombre: Math.round(
      Number(film.budgetNombre || 0)
    ),

    box_office: film.boxOffice || "Inconnu",

    // BIGINT → entier obligatoire
    box_office_nombre: Math.round(
      Number(film.boxOfficeNombre || 0)
    ),

    // BIGINT → entier obligatoire
    marketing_nombre: Math.round(
      Number(film.marketingEstime || 0)
    ),

    // BIGINT → entier obligatoire
    rentabilite_nombre: Math.round(
      Number(film.rentabiliteEstimee || 0)
    ),

    // NUMERIC → peut garder les décimales
    pourcentage:
      Number(film.budgetNombre || 0) > 0
        ? (
            Number(film.rentabiliteEstimee || 0) /
            (
              Number(film.budgetNombre || 0) +
              Number(film.marketingEstime || 0)
            )
          ) * 100
        : 0,

    duree:
      film.duree != null
        ? Number(film.duree)
        : null,

    genres:
      Array.isArray(film.genres)
        ? film.genres
        : []
  }));

  console.log("🟡 Première ligne envoyée à Supabase :");
  console.log(lignes[0]);

  console.log(
    "🟡 Nombre de lignes à envoyer :",
    lignes.length
  );

  // Vérification AVANT Supabase
  lignes.forEach((film, index) => {

    if (!Number.isInteger(film.budget_nombre)) {
      console.error("🚨 budget_nombre invalide :", {
        index,
        tmdb_id: film.tmdb_id,
        titre: film.titre,
        budget_nombre: film.budget_nombre
      });
    }

    if (!Number.isInteger(film.box_office_nombre)) {
      console.error("🚨 box_office_nombre invalide :", {
        index,
        tmdb_id: film.tmdb_id,
        titre: film.titre,
        box_office_nombre: film.box_office_nombre
      });
    }

    if (!Number.isInteger(film.marketing_nombre)) {
      console.error("🚨 marketing_nombre invalide :", {
        index,
        tmdb_id: film.tmdb_id,
        titre: film.titre,
        marketing_nombre: film.marketing_nombre
      });
    }

    if (!Number.isInteger(film.rentabilite_nombre)) {
      console.error("🚨 rentabilite_nombre invalide :", {
        index,
        tmdb_id: film.tmdb_id,
        titre: film.titre,
        rentabilite_nombre: film.rentabilite_nombre
      });
    }

  });

  const { data, error } = await supabase
    .from("films_globaux")
    .upsert(
      lignes,
      {
        onConflict: "tmdb_id"
      }
    )
    .select();

  if (error) {

    console.error("🔴 ERREUR SUPABASE COMPLÈTE :");
    console.error(error);

    console.error("Message :", error.message);
    console.error("Details :", error.details);
    console.error("Hint :", error.hint);
    console.error("Code :", error.code);

    throw error;
  }

  console.log("🟢 SUPABASE OK !");
  console.log(
    "Nombre de lignes enregistrées :",
    data?.length
  );

  console.log(data);
}

const API_KEY = import.meta.env.VITE_TMDB_KEY;
const OMDB_KEY = import.meta.env.VITE_OMDB_KEY;



/* =========================================================
   MARKETING ESTIMÉ
   ========================================================= */

function calculerMarketingEstime(budget) {

  if (!budget) {
    return 0;
  }

  const tauxMarketing = Math.min(
    0.25 + (budget / 500000000) * 0.25,
    0.50
  );

  return Math.round(budget * tauxMarketing);
}


/* =========================================================
   RENTABILITÉ ESTIMÉE
   ========================================================= */

function calculerRentabiliteEstimee(boxOffice, budget) {

  if (!boxOffice || !budget) {
    return 0;
  }

  const partStudio = boxOffice * 0.45;

  const marketing =
    calculerMarketingEstime(budget);

  return Math.round(partStudio - budget - marketing);
}


/* =========================================================
   TRANSFORMER UN FILM TMDB
   ========================================================= */

async function completerFilm(film) {

  try {

    const details = await fetch(
      `https://api.themoviedb.org/3/movie/${film.id}?api_key=${API_KEY}&language=fr-FR&append_to_response=credits,external_ids`
    );

    const infos = await details.json();

    let noteImdb = 0;

    let vraiBoxOffice =
      infos.revenue || 0;


    /* =====================================================
       IMDb + OMDb
       ===================================================== */

    if (infos.external_ids?.imdb_id) {

      try {

        const omdb = await fetch(
          `https://www.omdbapi.com/?i=${infos.external_ids.imdb_id}&apikey=${OMDB_KEY}`
        );

        const donneesImdb =
          await omdb.json();

        if (
          donneesImdb.imdbRating &&
          donneesImdb.imdbRating !== "N/A"
        ) {

          noteImdb =
            Number(donneesImdb.imdbRating) * 10;

        }


        if (
          !vraiBoxOffice &&
          donneesImdb.BoxOffice &&
          donneesImdb.BoxOffice !== "N/A"
        ) {

          vraiBoxOffice =
            Number(
              donneesImdb.BoxOffice
                .replace(/[^0-9]/g, "")
            );

        }

      }
      catch (e) {

        console.error(
          "Erreur OMDb :",
          e
        );

      }

    }


    /* =====================================================
       FILM FINAL
       ===================================================== */

    return {

      ...infos,

      genres:
        infos.genres
          ? infos.genres.map(
              genre => genre.name
            )
          : [],

      budget:
        infos.budget
          ? infos.budget.toLocaleString(
              "fr-FR"
            ) + " $"
          : "Budget inconnu",

      budgetNombre:
        infos.budget || 0,

      boxOffice:
        vraiBoxOffice
          ? vraiBoxOffice.toLocaleString(
              "fr-FR"
            ) + " $"
          : "Inconnu",

      boxOfficeNombre:
        vraiBoxOffice,

      rentabiliteEstimee:
        calculerRentabiliteEstimee(
          vraiBoxOffice,
          infos.budget || 0
        ),

      marketingEstime:
        calculerMarketingEstime(
          infos.budget || 0
        ),

      imdbId:
        infos.external_ids?.imdb_id ||
        null,

      imdb:
        noteImdb

    };

  }
  catch (e) {

    console.error(
      "Erreur récupération film TMDB :",
      e
    );

    return null;

  }

}


/* =========================================================
   RECHERCHE D'UN FILM
   ========================================================= */

export async function chercherFilm(titre) {

  

  const url =
    `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=fr-FR&query=${encodeURIComponent(titre)}`;


  const reponse =
    await fetch(url);

  const donnees =
    await reponse.json();


  const films =
    donnees.results || [];


  const filmsComplets =
    await Promise.all(

      films
        .slice(0, 5)
        .map(film =>
          completerFilm(film)
        )

    );


  return filmsComplets
    .filter(Boolean);

}


/* =========================================================
   CATALOGUE GLOBAL TMDB
   ========================================================= */

/* =========================================================
   CATALOGUE GLOBAL TMDB — AVEC CACHE SUPABASE
   ========================================================= */

async function recupererTousLesFilmsExistants() {

  const tousLesFilms = [];

  const taillePage = 1000;

  let debut = 0;

  while (true) {

    const { data, error } = await supabase
      .from("films_globaux")
      .select("*")
      .order("tmdb_id", { ascending: true })
      .range(
        debut,
        debut + taillePage - 1
      );

    if (error) {

      console.error(
        "🔴 Erreur récupération films Supabase :",
        error
      );

      throw error;

    }

    if (!data || !data.length) {
      break;
    }

    tousLesFilms.push(...data);

    console.log(
      `📦 Supabase : ${tousLesFilms.length} films récupérés`
    );

    if (data.length < taillePage) {
      break;
    }

    debut += taillePage;

  }

  return tousLesFilms;

}

   export async function chercherFilmsGlobaux(page = 1) {

  console.log("=================================");
  console.log("🔵 CHARGEMENT CLASSEMENT GLOBAL");
  console.log("Page TMDB :", page);
  console.log("=================================");


  /* =======================================================
     1. RÉCUPÉRER LES FILMS DÉJÀ PRÉSENTS DANS SUPABASE
     ======================================================= */

  const filmsExistants =
  await recupererTousLesFilmsExistants();

console.log(
  "🟢 Films déjà présents dans Supabase :",
  filmsExistants.length
);


  /* =======================================================
     2. CRÉER UN SET DES IDs TMDB EXISTANTS
     ======================================================= */

  const idsExistants = new Set(
    (filmsExistants || []).map(
      film => Number(film.tmdb_id)
    )
  );


  /* =======================================================
     3. RÉCUPÉRER UNE PAGE TMDB
     ======================================================= */

  const url =
    `https://api.themoviedb.org/3/discover/movie` +
    `?api_key=${API_KEY}` +
    `&language=fr-FR` +
    `&sort_by=popularity.desc` +
    `&include_adult=false` +
    `&include_video=false` +
    `&page=${page}`;


  const reponse =
    await fetch(url);


  if (!reponse.ok) {

    throw new Error(
      "Impossible de récupérer les films TMDB."
    );

  }


  const donnees =
    await reponse.json();


  const films =
    donnees.results || [];


  console.log(
    "🟡 Films récupérés depuis TMDB :",
    films.length
  );


  /* =======================================================
     4. NE GARDER QUE LES FILMS ABSENTS DE SUPABASE
     ======================================================= */

  const nouveauxFilms =
    films.filter(
      film =>
        !idsExistants.has(
          Number(film.id)
        )
    );


  console.log(
    "🆕 Nouveaux films à traiter :",
    nouveauxFilms.length
  );


  console.log(
    "⏭️ Films déjà connus ignorés :",
    films.length - nouveauxFilms.length
  );


  /* =======================================================
     5. SI TOUT EST DÉJÀ EN BASE → AUCUN APPEL OMDB
     ======================================================= */

  if (!nouveauxFilms.length) {

    console.log(
      "✅ Tous les films de cette page sont déjà en Supabase."
    );

    return {

      films: filmsExistants || [],

      page:
        donnees.page || page,

      totalPages:
        donnees.total_pages || 1,

      totalResults:
        donnees.total_results || 0

    };

  }


  /* =======================================================
     6. OMDB UNIQUEMENT POUR LES NOUVEAUX FILMS
     ======================================================= */

  const filmsComplets = [];


  for (const film of nouveauxFilms) {

    try {

      console.log(
        "🎬 Nouveau film :",
        film.title,
        "| TMDB ID :",
        film.id
      );


      const filmComplet =
        await completerFilm(film);


      if (filmComplet) {

        filmsComplets.push(
          filmComplet
        );

      }


      /*
       * Petite pause pour éviter de bombarder OMDb.
       * 250 ms = environ 4 requêtes/seconde maximum.
       */

      await new Promise(
        resolve =>
          setTimeout(resolve, 250)
      );

    }
    catch (e) {

      console.error(
        "❌ Erreur film :",
        film.title,
        e
      );

    }

  }


  /* =======================================================
     7. TRANSFORMATION DES NOUVEAUX FILMS
     ======================================================= */

  const filmsValides =
    filmsComplets
      .filter(
        film =>
          film &&
          Number(film.budgetNombre) > 0 &&
          Number(film.boxOfficeNombre) > 0
      )
      .map(film => ({

        /* =========================
           IDENTITÉ
           ========================= */

        id:
          `tmdb-${film.id}`,

        tmdbId:
          film.id,

        titre:
          film.title ||
          film.original_title ||
          "Titre inconnu",

        poster:
          film.poster_path
            ? `https://image.tmdb.org/t/p/w500${film.poster_path}`
            : "",


        /* =========================
           DATE
           ========================= */

        dateSortie:
          film.release_date || "",


        /* =========================
           INFOS
           ========================= */

        realisateur:
          film.credits?.crew?.find(
            personne =>
              personne.job === "Director"
          )?.name || "Inconnu",

        synopsis:
          film.overview ||
          "Pas de synopsis disponible",

        duree:
          film.runtime || null,

        genres:
          film.genres || [],


        /* =========================
           NOTE IMDb
           ========================= */

        imdb:
          film.imdb &&
          Number(film.imdb) > 0
            ? Number(film.imdb)
            : film.vote_average
              ? Number(film.vote_average) * 10
              : 0,


        /* =========================
           BUDGET
           ========================= */

        budget:
          film.budgetNombre
            ? `${Number(
                film.budgetNombre
              ).toLocaleString("fr-FR")} $`
            : "Inconnu",

        budgetNombre:
          Number(
            film.budgetNombre || 0
          ),


        /* =========================
           BOX OFFICE
           ========================= */

        boxOffice:
          film.boxOfficeNombre
            ? `${Number(
                film.boxOfficeNombre
              ).toLocaleString("fr-FR")} $`
            : "Inconnu",

        boxOfficeNombre:
          Number(
            film.boxOfficeNombre || 0
          ),


        /* =========================
           RENTABILITÉ
           ========================= */

        rentabiliteEstimee:
          Number(
            film.rentabiliteEstimee || 0
          ),

        marketingEstime:
          Number(
            film.marketingEstime || 0
          ),


        /* =========================
           INFLATION
           ========================= */

        boxOfficeInflation:
          null,


        /* =========================
           NOTES PERSONNELLES
           ========================= */

        note: null,

        scenario: null,
        personnages: null,
        realisation: null,
        ambiance: null,
        visuels: null,
        musique: null,
        rythme: null,
        impact: null,
        rewatch: null,


        global:
          true

      }));


  /* =======================================================
     8. ENREGISTRER UNIQUEMENT LES NOUVEAUX
     ======================================================= */

  if (filmsValides.length) {

    console.log(
      "💾 Enregistrement de",
      filmsValides.length,
      "nouveaux films..."
    );


    await synchroniserFilmsGlobaux(
      filmsValides
    );

  }


  /* =======================================================
     9. RECHARGER SUPABASE APRÈS L'IMPORT
     ======================================================= */

  const filmsFinaux =
  await recupererTousLesFilmsExistants();


  


  console.log(
    "🟢 Total films maintenant dans Supabase :",
    filmsFinaux?.length || 0
  );


  return {

    films:
      filmsFinaux || [],

    page:
      donnees.page || page,

    totalPages:
      donnees.total_pages || 1,

    totalResults:
      donnees.total_results || 0

  };

}

/* =========================================================
   ACTUALISER LES NOTES IMDb MANQUANTES
   ========================================================= */

export async function actualiserImdbManquants() {

  console.log("🔵 Recherche des notes IMDb manquantes...");

  const { data: films, error } = await supabase
    .from("films_globaux")
    .select("tmdb_id, imdb")
    .or("imdb.is.null,imdb.eq.0");

  if (error) {
    console.error(
      "❌ Erreur récupération IMDb manquants :",
      error
    );
    return;
  }

  if (!films || films.length === 0) {
    console.log("🟢 Toutes les notes IMDb sont déjà présentes.");
    return;
  }

  console.log(
    `🎬 ${films.length} film(s) ont une note IMDb manquante.`
  );

  for (const film of films) {

    try {

      /* Récupération des infos TMDB */
      const reponse = await fetch(
        `https://api.themoviedb.org/3/movie/${film.tmdb_id}?api_key=${API_KEY}&language=fr-FR&append_to_response=external_ids`
      );

      if (!reponse.ok) {
        console.error(
          "❌ Erreur TMDB pour",
          film.tmdb_id
        );
        continue;
      }

      const infos = await reponse.json();

      const imdbId =
        infos.external_ids?.imdb_id;

      if (!imdbId) {
        console.log(
          "⚠️ Pas d'IMDb ID pour",
          film.tmdb_id
        );
        continue;
      }


      /* Appel OMDb */
      const omdbReponse = await fetch(
        `https://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_KEY}`
      );

      const donneesImdb =
        await omdbReponse.json();


      if (
        donneesImdb.imdbRating &&
        donneesImdb.imdbRating !== "N/A"
      ) {

        const noteImdb =
          Number(donneesImdb.imdbRating) * 10;


        /* Mise à jour Supabase */
        const { error: updateError } =
          await supabase
            .from("films_globaux")
            .update({
              imdb: noteImdb
            })
            .eq("tmdb_id", film.tmdb_id);


        if (updateError) {

          console.error(
            "❌ Erreur mise à jour IMDb :",
            updateError
          );

        } else {

          console.log(
            `✅ IMDb mise à jour : ${film.tmdb_id} → ${noteImdb}/100`
          );

        }

      } else {

        console.log(
          `⚠️ IMDb toujours inconnue : ${film.tmdb_id}`
        );

      }


      /* Petite pause entre les appels */
      await new Promise(
        resolve =>
          setTimeout(resolve, 300)
      );

    }
    catch (error) {

      console.error(
        "❌ Erreur actualisation IMDb :",
        error
      );

    }

  }

  console.log("🟢 Actualisation IMDb terminée.");

}

export async function actualiserImdbFilmsUtilisateur(userId) {

  if (!userId) return;

  console.log("🔵 Vérification des notes IMDb de mes films...");

  const { data: films, error } = await supabase
    .from("films")
    .select("id, titre, tmdb_id, imdb")
    .eq("user_id", userId)
    .or("imdb.is.null,imdb.eq.0");

  if (error) {
    console.error(
      "❌ Erreur récupération films IMDb manquants :",
      error
    );
    return;
  }

  if (!films || films.length === 0) {
    console.log("🟢 Aucune note IMDb manquante.");
    return;
  }

  console.log(
    `🎬 ${films.length} film(s) à vérifier.`
  );

  for (const film of films) {

    try {

      let tmdbId = film.tmdb_id;

      /* =====================================================
         1. SI LE TMDB_ID MANQUE → RECHERCHE PAR TITRE
         ===================================================== */

      if (!tmdbId) {

        console.log(
          `🔎 Pas de tmdb_id pour "${film.titre}" → recherche TMDB...`
        );

        const rechercheResponse = await fetch(
          `https://api.themoviedb.org/3/search/movie` +
          `?api_key=${API_KEY}` +
          `&language=fr-FR` +
          `&query=${encodeURIComponent(film.titre)}`
        );

        if (!rechercheResponse.ok) {
          console.error(
            "❌ Erreur recherche TMDB :",
            film.titre
          );
          continue;
        }

        const recherche =
          await rechercheResponse.json();

        const resultat =
          recherche.results?.[0];

        if (!resultat) {

          console.log(
            `⚠️ Film introuvable sur TMDB : ${film.titre}`
          );

          continue;
        }

        tmdbId = resultat.id;

        console.log(
          `✅ TMDB trouvé pour "${film.titre}" → ${tmdbId}`
        );

        /*
         * On enregistre également le tmdb_id
         * pour ne plus avoir à refaire cette recherche.
         */

        const { error: tmdbUpdateError } =
          await supabase
            .from("films")
            .update({
              tmdb_id: tmdbId
            })
            .eq("id", film.id)
            .eq("user_id", userId);

        if (tmdbUpdateError) {

          console.error(
            "⚠️ Impossible d'enregistrer le tmdb_id :",
            tmdbUpdateError
          );

        }

      }


      /* =====================================================
         2. RÉCUPÉRER L'IMDb ID DEPUIS TMDB
         ===================================================== */

      const reponse = await fetch(
        `https://api.themoviedb.org/3/movie/${tmdbId}` +
        `?api_key=${API_KEY}` +
        `&language=fr-FR` +
        `&append_to_response=external_ids`
      );

      if (!reponse.ok) {

        console.error(
          `❌ Erreur TMDB pour "${film.titre}"`
        );

        continue;
      }

      const infos =
        await reponse.json();

      const imdbId =
        infos.external_ids?.imdb_id;

      if (!imdbId) {

        console.log(
          `⚠️ Aucun IMDb ID pour "${film.titre}"`
        );

        continue;
      }


      /* =====================================================
         3. RÉCUPÉRER LA NOTE IMDb VIA OMDb
         ===================================================== */

      const omdbReponse = await fetch(
        `https://www.omdbapi.com/` +
        `?i=${imdbId}` +
        `&apikey=${OMDB_KEY}`
      );

      const donneesImdb =
        await omdbReponse.json();


      if (
        donneesImdb.imdbRating &&
        donneesImdb.imdbRating !== "N/A"
      ) {

        const noteImdb =
          Number(donneesImdb.imdbRating) * 10;


        /* =================================================
           4. ENREGISTRER LA NOTE DANS FILMS
           ================================================= */

        const { error: updateError } =
          await supabase
            .from("films")
            .update({
              imdb: noteImdb
            })
            .eq("id", film.id)
            .eq("user_id", userId);


        if (updateError) {

          console.error(
            `❌ Erreur mise à jour IMDb pour "${film.titre}" :`,
            updateError
          );

        } else {

          console.log(
            `✅ ${film.titre} → IMDb ${noteImdb}/100`
          );

        }

      } else {

        console.log(
          `⚠️ IMDb toujours inconnue : ${film.titre}`
        );

      }


      /* Petite pause pour éviter de flinguer OMDb */

      await new Promise(
        resolve =>
          setTimeout(resolve, 300)
      );

    }

    catch (error) {

      console.error(
        `❌ Erreur actualisation IMDb pour "${film.titre}" :`,
        error
      );

    }

  }

  console.log(
    "🟢 Vérification IMDb terminée."
  );

}