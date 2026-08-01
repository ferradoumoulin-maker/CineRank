import { BrowserRouter, Routes, Route } from "react-router-dom";

import Collection from "./pages/Collection";
import AjouterFilm from "./pages/AjouterFilm";
import FicheFilm from "./pages/FicheFilm";
import ModifierFilm from "./pages/ModifierFilm";
import Classement from "./pages/Classement";
import Connexion from "./pages/Connexion";
import Profil from "./pages/Profil";
import Amis from "./pages/Amis"; import AjouterAmi from "./pages/AjouterAmi";
import Ami from "./pages/Ami";

import "./index.css";


function App(){

return (

<BrowserRouter>

<Routes>

<Route 
path="/" 
element={<Collection/>}
/>


<Route
path="/ajouter"
element={<AjouterFilm/>}
/>


<Route
path="/film/:id"
element={<FicheFilm/>}
/>


<Route
path="/modifier/:id"
element={<ModifierFilm/>}
/>

<Route
  path="/classement"
  element={<Classement/>}
/>

<Route
  path="/classement-global"
  element={<Classement/>}
/>

<Route
  path="/connexion"
  element={<Connexion/>}
/>

<Route
  path="/profil"
  element={<Profil/>}
/>

<Route
  path="/amis"
  element={<Amis/>}
/>

<Route path="/amis" element={<Amis />} /> <Route path="/amis/ajouter" element={<AjouterAmi />} />
<Route path="/ami/:id" element={<Ami />} />
</Routes>

</BrowserRouter>

)

}


export default App;