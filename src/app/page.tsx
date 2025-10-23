import { CalculatorApp } from '@/components/calculator-app';

export default function Home() {
  return (
    <main className="flex bg-background items-center justify-center min-h-screen p-2 sm:p-4">
      <CalculatorApp />
    </main>
  );
}
