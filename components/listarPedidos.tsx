"use client";

import {
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PlusCircleIcon, LogOutIcon } from "lucide-react";
import MaterialModal from "./forms";
import Cookies from "js-cookie";

interface Pedido {
  Codigo: string;
  nome: string;
  data: string;
  quantidade: string;
  estado: "Pendente" | "Entregue" | "Cancelado" | string;
}

export default function ListarPedidos() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{
    nome: string;
    mecanografico: string;
  } | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  const router = useRouter();

  const pedidosFiltrados = pedidos.filter((pedido) =>
    pedido.nome.toLowerCase().includes(filtro.toLowerCase()),
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Acessa o cookie apenas no lado do cliente
      const storedUser = Cookies.get("usuario");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
        } catch (err) {
          console.error("Erro ao analisar dados:", err);
        }
      } else {
        router.push("/"); // Redireciona se não encontrar usuário
      }
    }
  }, [router]);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = Cookies.get("cachedPedidos");
      if (cached) {
        setPedidos(JSON.parse(cached));
        setLoading(false);
      } else {
        fetchPedidos();
      }
    }
  }, []); 

  const fetchPedidos = async () => {
    const usuario = Cookies.get("usuario");
  
    if (!usuario) return; // Caso não tenha usuário, não faz nada
  
    const mec = parseInt(JSON.parse(usuario)?.mec);
  
    if (!mec) return setLoading(false);
  
    try {
      Cookies.remove("cachedPedidos");
  
      const response = await fetch(
        "https://prod-151.westeurope.logic.azure.com:443/workflows/3341d60cb9f04eb0b6857840b857b333/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=lLtrjv2GCTDBJhc7wlRfRI2dWSLqElOQKB1HP_4mppo",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mec }),
        }
      );
  
      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
  
      const data = await response.json();
      setPedidos(data);
      Cookies.set("cachedPedidos", JSON.stringify(data), { expires: 7 }); // Salva o cookie por 7 dias
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
      setPedidos([]); // Adiciona uma lista vazia caso ocorra erro
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }
  

  const handleLogout = () => {
    Cookies.remove("usuario");
    Cookies.remove("cachedPedidos");
    router.push("/");
  };

  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <img src="/logo.png" alt="logo" className="mb-5 block w-24" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Meus Pedidos
          </h1>
          {user && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Bem-vindo, <strong>{user.nome}</strong> (MEC: {user.mecanografico}
              )
            </p>
          )}
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Pesquisar material..."
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 pl-10 text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <div className="absolute top-2.5 left-3 text-gray-400">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 
                  4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Adicionar
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            <LogOutIcon className="h-5 w-5" />
            Sair
          </button>
        </div>
      </div>

      {/* Modal */}
      <MaterialModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onAfterAdd={() => {
          fetchPedidos();
          setOpen(false);
        }}
      />

      {/* Tabela */}
      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-700">
        {loading ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Carregando pedidos...
          </div>
        ) : (
          <>
            <Table>
              <TableHead className="bg-gray-100 dark:bg-gray-800">
                <TableRow>
                  <TableHeadCell className="p-4">
                    <Checkbox />
                  </TableHeadCell>
                  <TableHeadCell>Código</TableHeadCell>
                  <TableHeadCell>Descrição</TableHeadCell>
                  <TableHeadCell>Data</TableHeadCell>
                  <TableHeadCell>Qtd.</TableHeadCell>
                  <TableHeadCell>Estado</TableHeadCell>
                </TableRow>
              </TableHead>
            </Table>
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableBody>
                  {pedidosFiltrados.map((pedido, idx) => (
                    <TableRow
                      key={idx}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <TableCell className="p-4">
                        <Checkbox />
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        {pedido.Codigo}
                      </TableCell>
                      <TableCell>{pedido.nome}</TableCell>
                      <TableCell>
                        {new Date(pedido.data).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{pedido.quantidade}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                            pedido.estado === "Entregue"
                              ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200"
                          }`}
                        >
                          {pedido.estado}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
