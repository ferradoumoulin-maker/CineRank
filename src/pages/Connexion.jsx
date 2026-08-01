import { useState } from "react";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";


function Connexion(){

  const navigate = useNavigate();

  const [email,setEmail] = useState("");
  const [motDePasse,setMotDePasse] = useState("");
  const [pseudo,setPseudo] = useState("");

  const [inscription,setInscription] = useState(false);


  async function envoyer(){

    /* =====================================================
       VERIFICATIONS
       ===================================================== */

    if(!email || !motDePasse){

      alert("⚠️ Remplis ton email et ton mot de passe.");
      return;

    }


    if(inscription && !pseudo.trim()){

      alert("⚠️ Choisis un pseudo.");
      return;

    }


    /* =====================================================
       INSCRIPTION
       ===================================================== */

    if(inscription){

      const resultat =
        await supabase.auth.signUp({

          email: email.trim(),

          password: motDePasse

        });


      if(resultat.error){

        alert(resultat.error.message);
        return;

      }


      /*
       * Selon les réglages Supabase,
       * l'utilisateur peut devoir confirmer son email
       * avant que Supabase crée une session.
       */

      const utilisateur =
        resultat.data?.user;


      if(utilisateur){

        const { error: erreurProfil } =
          await supabase
            .from("profils")
            .insert({

              user_id: utilisateur.id,

              pseudo: pseudo.trim(),

              bibliotheque_visible: "public"

            });


        if(erreurProfil){

          console.error(
            "ERREUR CREATION PROFIL :",
            erreurProfil
          );

          /*
           * Si le profil n'a pas pu être créé,
           * le compte existe quand même.
           */
          alert(
            "Compte créé, mais le profil n'a pas pu être créé. " +
            "On corrigera ça ensuite."
          );

          return;

        }

      }


      alert(
        "🎉 Compte créé ! " +
        "Vérifie ton email si Supabase te le demande."
      );


      /*
       * Si aucune confirmation email n'est nécessaire,
       * on peut directement retourner à l'accueil.
       */
      if(utilisateur){

        navigate("/");

      }


      return;

    }


    /* =====================================================
       CONNEXION
       ===================================================== */

    const resultat =
      await supabase.auth.signInWithPassword({

        email: email.trim(),

        password: motDePasse

      });


    if(resultat.error){

      alert(resultat.error.message);
      return;

    }


    /*
     * On vérifie que le profil existe.
     */

    const utilisateur =
      resultat.data?.user;


    if(utilisateur){

      const { data: profil, error } =
        await supabase
          .from("profils")
          .select("user_id,pseudo,bibliotheque_visible")
          .eq("user_id", utilisateur.id)
          .maybeSingle();


      if(error){

        console.error(
          "ERREUR RECUPERATION PROFIL :",
          error
        );

      }


      /*
       * Si le compte existait déjà mais qu'il n'a pas encore
       * de profil, on le signalera.
       *
       * On ne bloque pas la connexion pour l'instant.
       */

      if(!profil){

        alert(
          "⚠️ Connexion réussie, mais ton profil n'existe pas encore."
        );

      }
      else{

        alert("✅ Connexion réussie !");

      }

    }


    navigate("/");

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


        {/* =================================================
            PSEUDO
            ================================================= */}

        {inscription && (

          <input

            placeholder="Pseudo"

            type="text"

            value={pseudo}

            maxLength={30}

            onChange={(e)=>
              setPseudo(e.target.value)
            }

          />

        )}



        {/* =================================================
            EMAIL
            ================================================= */}

        <input

          placeholder="Email"

          type="email"

          value={email}

          onChange={(e)=>
            setEmail(e.target.value)
          }

        />



        {/* =================================================
            MOT DE PASSE
            ================================================= */}

        <input

          placeholder="Mot de passe"

          type="password"

          value={motDePasse}

          onChange={(e)=>
            setMotDePasse(e.target.value)
          }

        />



        {/* =================================================
            BOUTON PRINCIPAL
            ================================================= */}

        <button onClick={envoyer}>

          {

            inscription

              ?

            "Créer mon compte"

              :

            "Se connecter"

          }

        </button>



        {/* =================================================
            CHANGER DE MODE
            ================================================= */}

        <button

          onClick={()=>{
            setInscription(!inscription);
            setPseudo("");
          }}

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

  );

}


export default Connexion;