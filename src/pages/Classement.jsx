import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";


function couleurNote(note){

  if(note === 20){
    return "#ff1493";
  }

  if(note <= 5){
    return "#3b0000";
  }

  if(note <= 7){
    return "#ff0000";
  }

  if(note <= 9){
    return "#ff8c00";
  }

  if(note <= 10.5){
    return "#ff6600";
  }

  if(note <= 12.5){
    return "#ffff00";
  }

  if(note <= 14.5){
    return "#9acd32";
  }

  if(note <= 16.5){
    return "#228b22";
  }

  if(note <= 17.5){
    return "#006400";
  }

  if(note <= 18.5){
    return "#00ffff";
  }

  if(note <= 19){
    return "#00008b";
  }

  if(note <= 19.5){
    return "#8000ff";
  }

  return "#ff1493";

}

function Classement(){

  const navigate = useNavigate();


  const [films,setFilms] = useState([]);


useEffect(()=>{

  chargerFilms();

},[]);



async function chargerFilms(){

  const {data:{user}} = await supabase.auth.getUser();


  if(!user){

    navigate("/connexion");
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


const [tri, setTri] = useState(null);

const [ordre, setOrdre] = useState("desc");

function trierPar(categorie){

  let nouvelOrdre = "desc";


  if(tri === categorie && ordre === "desc"){
    nouvelOrdre = "asc";
  }


  const nouveau = [...films].sort((a,b)=>{


    if(nouvelOrdre === "desc"){
      return b[categorie] - a[categorie];
    }
    else{
      return a[categorie] - b[categorie];
    }


  });


  setFilms(nouveau);
  setTri(categorie);
  setOrdre(nouvelOrdre);

}


  return(

    <div className="container">


      <h1 className="title">
        📊 Classement
      </h1>

      <button
  onClick={()=>navigate("/")}
>
  ← Retour au menu
</button>


      <div className="card classementCard">


        <table>


          <thead>

            <tr>

              <th>
                Film
              </th>

              <th onClick={()=>trierPar("note")}>
  NOTE
</th>

<th onClick={()=>trierPar("scenario")}>
  SCENAR
</th>

<th onClick={()=>trierPar("personnages")}>
  PERSOS
</th>

<th onClick={()=>trierPar("realisation")}>
  REAL
</th>

<th onClick={()=>trierPar("ambiance")}>
  AMB
</th>

<th onClick={()=>trierPar("visuels")}>
  VISU
</th>

<th onClick={()=>trierPar("musique")}>
  MUSIC
</th>

<th onClick={()=>trierPar("rythme")}>
  RYT
</th>

<th onClick={()=>trierPar("impact")}>
  IMPACT
</th>

<th onClick={()=>trierPar("rewatch")}>
  REWA
</th>

            </tr>

          </thead>



          <tbody>


          {
            films.map((film)=>(

              <tr key={film.id}>


                <td>

  <div className="filmClassement">

    <img
      src={film.poster}
      className="miniPoster"
      alt={film.titre}
    />

    <span>
      {film.titre}
    </span>

  </div>

</td>


                <td>

<div
className="petiteNote"
style={{
background: couleurNote(film.note)
}}
>

{Math.floor(film.note * 5)}

</div>

</td>


                <td>

<div
className="petiteNote"
style={{
background: couleurNote(film.scenario)
}}
>
{film.scenario}
</div>

</td>


                <td>

<div
className="petiteNote"
style={{
background: couleurNote(film.personnages)
}}
>
{film.personnages}
</div>

</td>


                <td>

<div
className="petiteNote"
style={{
background: couleurNote(film.realisation)
}}
>
{film.realisation}
</div>

</td>


                <td>

<div
className="petiteNote"
style={{
background: couleurNote(film.ambiance)
}}
>
{film.ambiance}
</div>

</td>


                <td>

<div
className="petiteNote"
style={{
background: couleurNote(film.visuels)
}}
>
{film.visuels}
</div>

</td>


                <td>

<div
className="petiteNote"
style={{
background: couleurNote(film.musique)
}}
>
{film.musique}
</div>

</td>


                <td>

<div
className="petiteNote"
style={{
background: couleurNote(film.rythme)
}}
>
{film.rythme}
</div>

</td>


                <td>

<div
className="petiteNote"
style={{
background: couleurNote(film.impact)
}}
>
{film.impact}
</div>

</td>


                <td>

<div
className="petiteNote"
style={{
background: couleurNote(film.rewatch)
}}
>
{film.rewatch}
</div>

</td>


              </tr>

            ))
          }


          </tbody>


        </table>


      </div>


    </div>

  );

}


export default Classement;