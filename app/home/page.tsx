import ListarPedidos from "@/components/listarPedidos";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-200 px-4 py-24 dark:bg-gray-900">
      <ListarPedidos />
    </main>
  );
}
