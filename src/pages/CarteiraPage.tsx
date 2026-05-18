import { CarteiraTable } from "@/components/carteira/CarteiraTable";

export function CarteiraPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Minha carteira</h1>
      <CarteiraTable />
    </div>
  );
}
