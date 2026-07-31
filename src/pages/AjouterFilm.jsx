import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { chercherFilm } from "../api/tmdb";

function AjouterFilm() {

  const navigate = useNavigate();


  const [resultats, setResultats] = useState([]);
  const [film, setFilm] = useState({

    titre: "",

    poster: "",
    dateSortie: "",
    realisateur: "",
    synopsis: "",
    boxOffice: "",
    imdb: 0,
    duree: null,
    genres: [],

    scenario: 0,
    personnages: 0,
    realisation: 0,
    ambiance: 0,
    visuels: 0,
    musique: 0,
    rythme: 0,
    impact: 0,
    rewatch: 0

});


  const criteres = [
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


  function modifier(champ, valeur){

    setFilm({
      ...film,
      [champ]: champ === "titre" ? valeur : Number(valeur)
    });

  }

async function rechercherTitre(titre){

  if(titre.length < 3){
    setResultats([]);
    return;
  }

  try {

    const filmsTrouves = await chercherFilm(titre);

    console.log(filmsTrouves);

    setResultats(filmsTrouves || []);

  }
  catch(e){

    console.error(e);

  }

}

  function calculerNote(){

    const coefficients = {
      scenario:4,
      personnages:3,
      realisation:2.5,
      ambiance:3,
      visuels:2,
      musique:1,
      rythme:1.5,
      impact:1.5,
      rewatch:1.5
    };


    let total = 0;
    let coef = 0;


    Object.keys(coefficients).forEach((c)=>{

      total += film[c] * coefficients[c];
      coef += coefficients[c];

    });


    return total / coef;

  }



  function enregistrer(){


    const nouveauFilm = {
      ...film,
      note: calculerNote(),
      id: Date.now()
    };


    const anciens =
      JSON.parse(localStorage.getItem("films")) || [];


    localStorage.setItem(
      "films",
      JSON.stringify([
        ...anciens,
        nouveauFilm
      ])
    );


    navigate("/film/" + nouveauFilm.id);

  }



  return (

    <div className="container">

      <h1 className="title">
        🎬 Ajouter un film
      </h1>


      <div className="card">


        <input
  placeholder="Nom du film"
  value={film.titre}
  onChange={(e)=>{

    modifier("titre",e.target.value);

    rechercherTitre(e.target.value);

  }}
/>

{
resultats.map((resultat)=>(

<div
key={resultat.id}
className="resultatFilm"

onClick={()=>{

  setFilm({
    ...film,

    titre: resultat.title,

    poster: resultat.poster_path
    ?
    "https://image.tmdb.org/t/p/w500" + resultat.poster_path
    :
    "",

    dateSortie: resultat.release_date,

    realisateur:
    resultat.credits?.crew?.find(
      (personne)=>personne.job==="Director"
    )?.name || "Inconnu",

    synopsis:
resultat.overview || "Pas de synopsis disponible",


boxOffice:
resultat.revenue
?
resultat.revenue.toLocaleString("fr-FR") + " $"
:
resultat.boxOffice,


imdb:
resultat.imdb || 0,


duree:
resultat.runtime || null,

    genres:
    resultat.genres || []

  });


  setResultats([]);

}}

>

<img
src={
resultat.poster_path
?
"https://image.tmdb.org/t/p/w200" + resultat.poster_path
:
"/no-image.png"
}
/>


<div className="resultatInfos">

<h2>
{resultat.title}
</h2>


<p>
📅 {
resultat.release_date
?
new Date(resultat.release_date)
.toLocaleDateString(
"fr-FR",
{
day:"numeric",
month:"long",
year:"numeric"
}
)
:
"Date inconnue"
}
</p>


<p>
🎬 {
resultat.credits?.crew?.find(
(personne)=>personne.job==="Director"
)?.name || "Réalisateur inconnu"
}
</p>


<p>
{
resultat.overview
?
resultat.overview.slice(0,150)+"..."
:
"Pas de résumé disponible"
}
</p>


</div>


</div>

))
}



        {
          criteres.map(([nom,label])=>(

            <div key={nom}>

              <label>
                {label}
              </label>

              <input
                type="number"
                min="0"
                max="20"
                step="0.5"
                value={film[nom]}
                onChange={(e)=>modifier(nom,e.target.value)}
              />

            </div>

          ))
        }


        <button onClick={enregistrer}>
          Créer la fiche
        </button>


      </div>


    </div>

  )

}


export default AjouterFilm;