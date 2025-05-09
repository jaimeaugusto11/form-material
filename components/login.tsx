'use client'

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";  // Importando a biblioteca js-cookie

export default function LoginPanel() {
  const router = useRouter();
  const [mec, setNumeroMec] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = Cookies.get('usuario');  // Verifica no cookie, não mais no localStorage
    if (user) {
      // Redirecionar para a home se já estiver logado
      router.push('/home');
    }
  }, []);

  async function handleLogin() {
    setLoading(true);
    try {
      const res = await fetch("https://prod-61.westeurope.logic.azure.com:443/workflows/0d7ab4b5537b40b8a98e6bd574fbbffb/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=QwXbZCkHaQz9vJf_sb_OQ-lbk4c1FCvIBUHZXDau4w8", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mec }),
      });
  
      const data = await res.json();
  
      console.log(data)
  
      // Verifica se data[0] existe e status é 'success'
      if (Array.isArray(data) && data[0]?.status === "success") {
        const user = data[0];
        Cookies.set("usuario", JSON.stringify(user), { expires: 7 }); 
        console.log(user) // Salvando no cookie
        router.push("/home");
      } else {
        toast.error("Número mecanográfico inválido.");
        setNumeroMec("");
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("Erro na comunicação com o servidor.");
      setNumeroMec("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-50">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-6">
        <div className="w-full max-w-md">
          <img src="/logo.png" alt="logo" className="mx-auto mb-8 block w-40" />

          <div className="rounded-2xl bg-white p-8 shadow">
            <h2 className="text-center text-3xl font-semibold text-slate-900">
              Acessar ao Formulário
            </h2>

            <form className="mt-12 space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-800">
                  Nº Mecanográfico
                </label>
                <div className="relative flex items-center">
                  <input
                    name="numeroMec"
                    type="number"
                    required
                    value={mec}
                    onChange={(e) => setNumeroMec(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-blue-600"
                    placeholder="Nº Mecanográfico"
                  />
                </div>
              </div>

              <div className="!mt-12">
                <button
                  type="submit"
                  onClick={handleLogin}
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-[15px] font-medium text-white hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
