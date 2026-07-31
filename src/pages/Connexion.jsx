import { useState } from "react";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";


function Connexion(){

  const navigate = useNavigate();

  const [email,setEmail] = useState("");
  const [motDePasse,setMotDePasse] = useState("");

  const [inscription,setInscription] = useState(false);


  async function envoyer(){

    let resultat;


    if(inscription){

      resultat = await supabase.auth.signUp({
        email: email,
        password: motDePasse
      });

    }
    else{

      resultat = await supabase.auth.signInWithPassword({
        email: email,
        password: motDePasse
      });

    }


    if(resultat.error){

      alert(resultat.error.message);
      return;

    }


    alert(
      inscription
      ?
      "Compte créé ! Vérifie ton email."
      :
      "Connexion réussie !"
    );


    if(!inscription){
      navigate("/");
    }


  }



return (

<div className="container">


<h1 className="title">
🔐 {
inscription
?
"Créer un compte"
:
"Connexion"
}
</h1>



<div className="card">


<input
placeholder="Email"
type="email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
/>


<input
placeholder="Mot de passe"
type="password"
value={motDePasse}
onChange={(e)=>setMotDePasse(e.target.value)}
/>


<button onClick={envoyer}>

{
inscription
?
"Créer mon compte"
:
"Se connecter"
}

</button>



<button
onClick={()=>setInscription(!inscription)}
>

{
inscription
?
"J'ai déjà un compte"
:
"Créer un compte"
}

</button>


</div>


</div>

)

}


export default Connexion;