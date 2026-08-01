import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";



function TailleTitre({titre}){

  const ref = useRef();

  const [taille,setTaille] = useState(35);


  useEffect(()=>{

    if(!ref.current) return;


    const largeur = ref.current.scrollWidth;
    const disponible = ref.current.parentElement.clientWidth;


    let nouvelleTaille = 35;


    if(largeur < disponible * 0.45){
      nouvelleTaille = 55;
    }
    else if(largeur < disponible * 0.70){
      nouvelleTaille = 45;
    }
    else{
      nouvelleTaille = 35;
    }


    setTaille(nouvelleTaille);


  },[titre]);


  return (
    <h3
      ref={ref}
      style={{
        fontSize:taille+"px"
      }}
    >
      {titre}
    </h3>
  );

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

function Collection(){

  

  const navigate = useNavigate();


  const [films,setFilms] = useState([]);
  const [vueCompacte,setVueCompacte] = useState(false);
  const [user,setUser] = useState(null);
  const [amis, setAmis] = useState([]);
  useEffect(()=>{

  verifierConnexion();

},[]);

async function verifierConnexion(){

  const {data:{user}} = await supabase.auth.getUser();


  setUser(user);


  if(user){

    chargerFilms();

  }

}

async function chargerFilms(){

  const {data:{user}} = await supabase.auth.getUser();


  if(!user){
  setFilms([]);
  return;
}


  const {data,error} = await supabase
    .from("films")
    .select("*")
    .eq("user_id",user.id);


  if(error){

    console.error(error);
    return;

  }


  setFilms(data);

}

async function deconnexion(){

  const confirmation = window.confirm(
    "⚠️ Es-tu sûr de vouloir te déconnecter ?"
  );


  if(!confirmation){
    return;
  }


  await supabase.auth.signOut();


  setUser(null);


  setFilms([]);


  

}


  async function supprimer(id){

  const confirmation = window.confirm(
    "⚠️ Es-tu sûr de vouloir supprimer ce film ?"
  );


  if(!confirmation){
    return;
  }


  const {error} = await supabase
    .from("films")
    .delete()
    .eq("id", id);


  if(error){

    console.error(error);
    alert("Erreur suppression");
    return;

  }


  setFilms(
    films.filter(
      (film)=>film.id !== id
    )
  );

}



  function trier(){

    const trie = [...films].sort(
      (a,b)=>b.note-a.note
    );

    setFilms(trie);

  }



  return (

    <div className="container">

      <div className="compteBouton">

{user ?

<div style={{
  display: "flex",
  gap: "10px"
}}>

  <button
    onClick={() => navigate("/amis")}
  >
    👥 Mes amis
  </button>

  <button
    onClick={() => navigate("/profil")}
  >
    👤 Profil
  </button>

  <button
    onClick={deconnexion}
  >
    🚪 Déconnexion
  </button>

</div>

:

<button
  onClick={() => navigate("/connexion")}
>
  🔐 Se connecter
</button>

}

</div>


      <h1 className="title">
        🎬 CineRank
      </h1>


      <div className="card menuPrincipal">


<button onClick={()=>navigate("/ajouter")}>
  ➕ Ajouter un film
</button>


<button onClick={()=>navigate("/classement")}>
  📊 Classement
</button>

<button onClick={()=>navigate("/classement-global")}>
  🌍 Classement global
</button>




<button onClick={trier}>
  ⭐ Trier par note
</button>


<button onClick={()=>setVueCompacte(!vueCompacte)}>
{
vueCompacte
?
"🖼️ Vue normale"
:
"🗂️ Vue compacte"
}
</button>


</div>





      <div className="filmsHeader">
  <div>
    <h2 className="titreFilms">
      Mes films
    </h2>

    <span className="filmsCompteur">
      {films.length} film{films.length > 1 ? "s" : ""}
    </span>
  </div>
</div>


<div className="card filmsContainer">


{
  films.length === 0 ?

        <p>
          Aucun film enregistré.
        </p>


        :


        films.map((film)=>(
          


          <div 
className={
vueCompacte
?
"filmCard compacte"
:
"filmCard"
}
key={film.id}
>





<div className="filmHaut">

    

  <div className="filmTitre">

    <TailleTitre titre={film.titre}/>

  </div>


  <div
    className="scoreBadge"
    style={{
      background: couleurNote(film.note)
    }}
  >

    <span className="scoreEntier">
      {Math.floor(film.note * 5)}
    </span>

    <span className="scoreDecimal">
      .{Math.floor((film.note * 5 % 1) * 10)}
    </span>

  </div>

</div>


<div className="filmBas">


  <div className="filmPresentation">

    {
      film.poster &&
      <img
        className="filmPoster"
        src={film.poster}
        alt={film.titre}
      />
    }


    <div className="filmInfos">

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


  <div className="noteSpectateurs">

    <div className="noteSpectateursTitre">
      ⭐ Note Spectateurs
    </div>


    <div
      className="noteSpectateursCarre"
      style={{
  background: couleurNote((film.imdb || 0) / 5)
}}
    >

      {film.imdb}

    </div>

  </div>


</div>


  </div>



  <div className="droiteFilm">


    



    <div className="miniNotes">

      {
        [
          ["scenario","Scénario"],
          ["personnages","Personnages"],
          ["realisation","Réalisation"],
          ["ambiance","Ambiance"],
          ["visuels","Visuels"],
          ["musique","Musique"],
          ["rythme","Rythme"],
          ["impact","Impact"],
          ["rewatch","Rewatch"]
        ].map(([nom,label])=>(

          <div className="miniNote" key={nom}>

            <span>
              {label}
            </span>

            <div className="miniBarreFond">

              <div
                className="miniBarreValeur"
                style={{
                  width:`${film[nom]*5}%`,
                  background:couleurNote(film[nom])
                }}
              />

            </div>

          </div>

        ))

      }

    </div>


  </div>


</div>

 <div className="actions">

  <button
    className="ficheButton"
    onClick={() => navigate("/film/"+film.id)}
  >
    📄 Fiche
  </button>


  <button
    className="modifierButton"
    onClick={() =>
      navigate("/modifier/"+film.id)
    }
  >
    ✏️
  </button>


  <button
    className="supprimerButton"
    onClick={() =>
      supprimer(film.id)
    }
  >
    🗑️
  </button>

</div>


</div>


        ))

      }


      </div>


    </div>

  )


}


export default Collection;