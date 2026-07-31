import { useParams, useNavigate } from "react-router-dom";

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


  const films =
    JSON.parse(localStorage.getItem("films")) || [];


  const film =
    films.find((f)=>f.id === Number(id));

    function supprimer(){

  const confirmation = window.confirm(
    "⚠️ Es-tu sûr de vouloir supprimer ce film ?"
  );


  if(!confirmation){
    return;
  }


  const nouveauxFilms = films.filter(
    (f)=>f.id !== film.id
  );


  localStorage.setItem(
    "films",
    JSON.stringify(nouveauxFilms)
  );


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
        🎬 {film.titre}
      </h1>
      <div className="fichePresentation">


  <img
    className="fichePoster"
    src={film.poster}
    alt={film.titre}
  />


  <div className="ficheInfos">


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
      💰 {film.boxOffice || "Box-office inconnu"}
    </p>



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


      <div
  className="scoreBadge ficheScore"
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

</div>



      <div className="card">


        <h2>
          Notes détaillées
        </h2>



        {
  criteres.map(([nom,label])=>(

    <div key={nom} className="noteBloc">

      <div className="noteTitre">

        {label}

        <strong>
          {film[nom]} /20
        </strong>

      </div>


      <div className="barreFond">

        <div

className="barreValeur"

style={{

width: `${film[nom] * 5}%`,

background: couleurNote(film[nom])

}}

>
</div>

      </div>


    </div>

  ))
}



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