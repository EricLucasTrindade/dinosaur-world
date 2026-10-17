import { ArvorePage } from "@/pages/ArvorePage";
import { IdiomaProvider } from "@/lib/i18n";

export default function App() {
  return (
    <IdiomaProvider>
      <div className="h-dvh">
        <ArvorePage />
      </div>
    </IdiomaProvider>
  );
}
