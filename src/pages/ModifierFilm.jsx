import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";


function ModifierFilm(){

  const {id} = useParams();
  const navigate = useNavigate();


  const films =
    JSON.parse(localStorage.getItem("films")) || [];


  const ancienFilm =
    films.find(
      (f)=>f.id === Number(id)
    );


  const [film,setFilm] = useState(ancienFilm);



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



  function modifier(champ,valeur){

    setFilm({

      ...film,

      [champ]:
      champ==="titre"
      ? valeur
      : Number(valeur)

    });

  }



  function calculerNote(){


    const coef = {

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


    let total=0;
    let totalCoef=0;


    Object.keys(coef).forEach(c=>{

      total += film[c]*coef[c];
      totalCoef += coef[c];

    });


    return total / totalCoef;


  }



  function sauvegarder(){


    const nouveauxFilms =
      films.map(f=>

        f.id===film.id

        ? {
            ...film,
            note:calculerNote()
          }

        : f

      );


    localStorage.setItem(
      "films",
      JSON.stringify(nouveauxFilms)
    );


    navigate("/film/"+film.id);

  }



  return (

    <div className="container">


      <h1 className="title">
        ✏️ Modifier {film.titre}
      </h1>


      <div className="card">


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

              onChange={
                e=>modifier(
                  nom,
                  e.target.value
                )
              }

            />

          </div>

        ))

      }


      <button onClick={sauvegarder}>
        💾 Sauvegarder
      </button>


      </div>


    </div>

  )


}


export default ModifierFilm;