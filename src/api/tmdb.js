const API_KEY = import.meta.env.VITE_TMDB_KEY;
const OMDB_KEY = import.meta.env.VITE_OMDB_KEY;


export async function chercherFilm(titre) {


  const url =
    `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&language=fr-FR&query=${encodeURIComponent(titre)}`;


  const reponse = await fetch(url);

  const donnees = await reponse.json();


  const films = donnees.results || [];


  const filmsComplets = await Promise.all(

    films.slice(0,5).map(async (film)=>{


      const details = await fetch(

        `https://api.themoviedb.org/3/movie/${film.id}?api_key=${API_KEY}&language=fr-FR&append_to_response=credits,external_ids`

      );


      const infos = await details.json();



      let noteImdb = 0;



      // Récupération note IMDb avec OMDb
      if(infos.external_ids?.imdb_id){


        const omdb = await fetch(

          `https://www.omdbapi.com/?i=${infos.external_ids.imdb_id}&apikey=${OMDB_KEY}`

        );


        const donneesImdb = await omdb.json();

	console.log("OMDB :", donneesImdb);

        if(donneesImdb.imdbRating && donneesImdb.imdbRating !== "N/A"){

          noteImdb = Number(donneesImdb.imdbRating) * 10;

        }


      }



      return {

        ...infos,


        boxOffice:
          infos.revenue
          ?
          infos.revenue.toLocaleString("fr-FR") + " $"
          :
          "Inconnu",



        imdbId:
          infos.external_ids?.imdb_id || null,


        imdb:
          noteImdb


      };


    })

  );


  return filmsComplets;


}