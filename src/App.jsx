import { BrowserRouter, Routes, Route } from "react-router-dom";

import Collection from "./pages/Collection";
import AjouterFilm from "./pages/AjouterFilm";
import FicheFilm from "./pages/FicheFilm";
import ModifierFilm from "./pages/ModifierFilm";
import Classement from "./pages/Classement";

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


</Routes>

</BrowserRouter>

)

}


export default App;