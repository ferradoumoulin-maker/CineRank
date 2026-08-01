import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client";

function Amis() {

  const navigate = useNavigate();

  const [amis, setAmis] = useState([]);
  const [chargement, setChargement] = useState(true);


  useEffect(() => {
    chargerAmis();
  }, []);


  async function chargerAmis() {

    setChargement(true);

    const {
      data: { user }
    } = await supabase.auth.getUser();


    if (!user) {
      navigate("/connexion");
      return;
    }


    const { data, error } = await supabase
      .from("amis")
      .select("id, ami_id, created_at")
      .eq("userid", user.id)
      .order("created_at", {
        ascending: false
      });


    if (error) {

      console.error(
        "Erreur chargement amis :",
        error
      );

      setChargement(false);

      return;
    }


    if (!data || data.length === 0) {

      setAmis([]);

      setChargement(false);

      return;
    }


    const ids = data.map(
      (ami) => ami.ami_id
    );


    const {
      data: profils,
      error: profilsError
    } = await supabase
      .from("profils")
      .select("user_id, pseudo")
      .in("user_id", ids);


    if (profilsError) {

      console.error(
        "Erreur chargement profils amis :",
        profilsError
      );

      setChargement(false);

      return;
    }


    const amisComplets = data.map((ami) => {

      const profil = profils?.find(
        (p) => p.user_id === ami.ami_id
      );


      return {

        id: ami.ami_id,

        relationId: ami.id,

        pseudo:
          profil?.pseudo || "Utilisateur"

      };

    });


    setAmis(amisComplets);

    setChargement(false);

  }


  if (chargement) {

    return (

      <div className="container amisPage">

        <p>
          Chargement...
        </p>

      </div>

    );

  }


  return (

    <div className="container amisPage">


      {/* HEADER */}

      <div className="amisPageHeader">

        <div>

          <div className="amisSurTitre">
            CINERANK · SOCIAL
          </div>

          <h1 className="amisTitre">
            👥 Mes amis
          </h1>

          <p className="amisSousTitre">
            Retrouve tes amis et compare vos films.
          </p>

        </div>


        <button
          className="amisAjouterButton"
          onClick={() =>
            navigate("/amis/ajouter")
          }
        >
          ＋ Ajouter un ami
        </button>

      </div>


      {/* LISTE */}

      <div className="amisBloc">

        <div className="amisBlocHeader">

          <div>

            <h2>
              👥 Mes amis
            </h2>

            <span>
              {amis.length} ami
              {amis.length > 1 ? "s" : ""}
            </span>

          </div>

        </div>


        <div className="card amisListe">

          {amis.length === 0 ? (

            <div className="amisEtatVide">

              <span>
                👥
              </span>

              <div>

                <strong>
                  Tu n'as pas encore d'amis.
                </strong>

                <p>
                  Clique sur « Ajouter un ami »
                  pour rechercher quelqu'un.
                </p>

              </div>

            </div>

          ) : (

            amis.map((ami) => (

              <div
                className="amiLigne"
                key={ami.id}
                onClick={() =>
                  navigate(`/ami/${ami.id}`)
                }
              >

                <div className="amiIdentite">

                  <div className="amiAvatar">

                    {ami.pseudo
                      ?.charAt(0)
                      .toUpperCase() || "?"}

                  </div>


                  <div className="amiInfos">

                    <strong>
                      {ami.pseudo}
                    </strong>

                    <span>
                      Ami CineRank
                    </span>

                  </div>

                </div>


                <div className="amiAction">
                  →
                </div>

              </div>

            ))

          )}

        </div>

      </div>


    </div>

  );

}


export default Amis;

