import React from "react";
import Products from "./pages/Products";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import  LowStock  from "./pages/LowStock";
import AuthForm from "./pages/AuthForm";

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/products" element={<Products />} />
      <Route path = "/low-stock" element={<LowStock/>}/>
      <Route path = "/" element={<AuthForm/>}/>
    </Routes>
    </BrowserRouter>
  );
}

export default App;