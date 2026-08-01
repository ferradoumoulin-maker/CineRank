import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { cpiUS } from "../data/cpiUS";

function calculerRentabiliteInflation(rentabilite, dateSortie){

  if(!rentabilite || !dateSortie){
    return "";
  }

  const annee = new Date(dateSortie).getFullYear();

  const cpiFilm = cpiUS[annee];
  const cpiActuel = cpiUS[2026];

  if(!cpiFilm || !cpiActuel){
    return "";
  }

  const resultat = rentabilite * (cpiActuel / cpiFilm);

  const signe = resultat >= 0 ? "+" : "";

  return `≈ ${signe}${Math.round(resultat).toLocaleString("fr-FR")} $`;
}

function calculerRentabilite(budget, boxOffice){

if(!budget || !boxOffice){
return null;
}

const budgetNombre = Number(
String(budget).replace(/[^0-9.-]/g,"")
);

const boxOfficeNombre = Number(
String(boxOffice).replace(/[^0-9.-]/g,"")
);

if(!budgetNombre || !boxOfficeNombre){
return null;
}

let marketing;

if(budgetNombre < 50_000_000){
marketing = budgetNombre * 0.35;
}
else if(budgetNombre < 100_000_000){
marketing = budgetNombre * 0.45;
}
else if(budgetNombre < 150_000_000){
marketing = budgetNombre * 0.50;
}
else if(budgetNombre < 200_000_000){
marketing = budgetNombre * 0.55;
}
else{
marketing = budgetNombre * 0.60;
}

const recettesStudio = boxOfficeNombre * 0.50;

return recettesStudio - budgetNombre - marketing;
}


function couleurNote(note){

  if(note === 20){
    return "#ff1493"; // rose pétant
  }


  if(note <= 5){

    const t = note / 5;

    return `rgb(
      ${Math.round(60 + t * 80)},
      0,
      0
    )`;

  }


  if(note <= 7){

    const t = (note - 5) / 2;

    return `rgb(
      ${Math.round(140 + t * 115)},
      0,
      0
    )`;

  }


  if(note <= 9){

    const t = (note - 7) / 2;

    return `rgb(
      255,
      ${Math.round(70 + t * 70)},
      0
    )`;

  }


  if(note <= 10.5){

    const t = (note - 9) / 1.5;

    return `rgb(
      255,
      ${Math.round(140 + t * 70)},
      0
    )`;

  }


  if(note <= 12.5){

    const t = (note - 10.5) / 2;

    return `rgb(
      255,
      ${Math.round(210 + t * 45)},
      0
    )`;

  }


  if(note <= 14.5){

    const t = (note - 12.5) / 2;

    return `rgb(
      ${Math.round(255 - t * 120)},
      255,
      0
    )`;

  }


  if(note <= 16.5){

    const t = (note - 14.5) / 2;

    return `rgb(
      ${Math.round(135 - t * 55)},
      ${Math.round(255 - t * 65)},
      0
    )`;

  }


  if(note <= 17.5){

    const t = (note - 16.5);

    return `rgb(
      ${Math.round(80 - t * 80)},
      ${Math.round(190 - t * 50)},
      0
    )`;

  }


  if(note <= 18.5){

    const t = (note - 17.5);

    return `rgb(
      0,
      ${Math.round(140 + t * 115)},
      255
    )`;

  }


  if(note <= 19){

    const t = (note - 18.5) / 0.5;

    return `rgb(
      0,
      ${Math.round(255 - t * 155)},
      255
    )`;

  }


  if(note <= 19.5){

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

function couleurImdb(note){

  if(note >= 90) return "#ff008c";

  if(note <= 30) return "#ff0000";

  if(note <= 50){
    const t=(note-30)/20;
    return `rgb(255,${Math.round(80+t*120)},0)`;
  }

  if(note <= 70){
    const t=(note-50)/20;
    return `rgb(255,200,${Math.round(t*50)})`;
  }

  if(note <= 85){
    const t=(note-70)/15;
    return `rgb(${Math.round(170-t*100)},255,0)`;
  }

  const t=(note-85)/15;

  return `rgb(0,255,${Math.round(80+t*170)})`;

}

function FicheFilm(){

  const {id} = useParams();
  const navigate = useNavigate();

  const [film,setFilm] = useState(null);


  useEffect(()=>{

    chargerFilm();

  },[]);



  async function chargerFilm(){

    const {data,error} = await supabase
      .from("films")
      .select("*")
      .eq("id", id)
      .single();


    if(error){

      console.error(error);
      return;

    }


    setFilm(data);

  }

    async function supprimer(){

  const confirmation = window.confirm(
    "⚠️ Es-tu sûr de vouloir supprimer ce film ?"
  );


  if(!confirmation){
    return;
  }


  const {error} = await supabase
    .from("films")
    .delete()
    .eq("id", film.id);


  if(error){

    console.error(error);
    alert("Erreur suppression");

    return;

  }


  navigate("/");

}



  if(!film){

    return (

      <div className="container">

        <h1>
          Film introuvable
        </h1>

      </div>

    )

  }



  const criteres = [

    ["scenario","Scénario"],
    ["personnages","Personnages"],
    ["realisation","Réalisation"],
    ["ambiance","Ambiance"],
    ["visuels","Visuels"],
    ["musique","Musique"],
    ["rythme","Rythme"],
    ["impact","Impact"],
    ["rewatch","Rewatch"]

  ];



  return (

    <div className="container">


      <h1 className="title">
  {film.titre}
</h1>
      <div className="fichePresentation">


  <img
    className="fichePoster"
    src={film.poster}
    alt={film.titre}
  />


  <div className="infosInfos">


<div className="infosGauche">


    <p>
      📅 {film.dateSortie
      ?
      new Date(film.dateSortie)
      .toLocaleDateString(
        "fr-FR",
        {
          day:"numeric",
          month:"long",
          year:"numeric"
        }
      )
      :
      "Date inconnue"}
    </p>


    <p>
      🎬 {film.realisateur || "Réalisateur inconnu"}
    </p>


    <p>
      🎭 {
        film.genres?.length
        ?
        film.genres.join(", ")
        :
        "Genre inconnu"
      }
    </p>


  </div>



  <div className="infosArgent">


    <div className="argentBloc">

      <strong>
        BUDGET :
      </strong>

      <p>
        {film.budget || "Budget inconnu"}
      </p>

    </div>



    <div className="argentBloc">

      <strong>
        BOX OFFICE :
      </strong>

      <p>
        {film.boxOffice || "Box-office inconnu"}
      </p>


      <small>
        Inflation :
        <br/>
        {film.boxOfficeInflation || "Inconnue"}
      </small>

    </div>


    <div
  className={`argentBloc rentabiliteBloc ${
    calculerRentabilite(film.budget, film.boxOffice) === null
      || calculerRentabilite(film.budget, film.boxOffice) === 0
      ? "rentabiliteInconnue"
      : calculerRentabilite(film.budget, film.boxOffice) < 0
      ? "rentabiliteNegative"
      : "rentabilitePositive"
  }`}
>

  <strong>
    RENTABILITÉ ESTIMÉE :
  </strong>

  <p>
    {calculerRentabilite(
      film.budget,
      film.boxOffice
    ) !== null
    ?
    `≈ ${
      calculerRentabilite(film.budget, film.boxOffice) >= 0
      ? "+"
      : ""
    }${Math.round(
      calculerRentabilite(film.budget, film.boxOffice)
    ).toLocaleString("fr-FR")} $`
    :
    "Inconnue"
    }
  </p>

  <small>
    Avec inflation :
    <br/>
    {calculerRentabiliteInflation(
      calculerRentabilite(
        film.budget,
        film.boxOffice
      ),
      film.dateSortie
    ) || "Inconnue"}
  </small>

</div>



  </div>



    <div className="imdbBloc">

  <div className="imdbTitre">
    NOTE SPECTATEUR
  </div>


  <div
    className="scoreBadge imdbScore"
    style={{
      background:
      couleurImdb(film.imdb || 0)
    }}
  >

    <span className="scoreEntier">
      {film.imdb || "?"}
    </span>

  </div>

</div>


  </div>


</div>



<div className="card synopsisCard">

<h2>
  Synopsis
</h2>


<p>
{film.synopsis || "Synopsis inconnu."}
</p>


</div>


      



      

  <div className="card notesDetaillees">

  <div className="notesHeader">

    <h2>
      Notes détaillées
    </h2>

    <span>
      9 critères
    </span>

  </div>


  <div className="notesAvecGlobale">

    <div
      className="ficheScore"
      style={{
        background: couleurNote(film.note)
      }}
    >

      <span className="scoreEntier">
        {Math.floor(film.note * 5)}
      </span>

      <span className="scoreDecimal">
        .{Math.floor(((film.note * 5) % 1) * 10)}
      </span>

      <span className="ficheScoreLabel">
        / 100
      </span>

    </div>


    <div className="notesGrille">

      {criteres.map(([nom, label]) => (

        <div key={nom} className="noteBloc">

          <div className="noteTitre">

            <span>
              {label}
            </span>

            <strong>
              {film[nom]}
              <small>/20</small>
            </strong>

          </div>


          <div className="barreFond">

            <div
              className="barreValeur"
              style={{
                width: `${film[nom] * 5}%`,
                background: couleurNote(film[nom])
              }}
            />

          </div>

        </div>

      ))}

    </div>

  </div>

</div>



      <div className="menuBoutons">

<button
  className="modifierButton"
  onClick={()=>
    navigate("/modifier/"+film.id)
  }
>
  ✏️
</button>


<button
  className="supprimerButton"
  onClick={supprimer}
>
  🗑️
</button>


<button
  onClick={()=>navigate("/")}
>
  ← Retour
</button>

</div>


    </div>

  )


}


export default FicheFilm;