import { RadioProvider } from "@/components/RadioProvider";
import { Hero } from "@/components/hero/Hero";
import { CircuitMap } from "@/components/map/CircuitMap";
import { CharacterRoster } from "@/components/characters/CharacterRoster";
import { PortholeViewer } from "@/components/porthole/PortholeViewer";
import { SpaceHamLoader } from "@/components/layout/SpaceHamLoader";
import { Footer, Lore, Signature, TopBar } from "@/components/layout/Sections";

export default function Page() {
  return (
    <RadioProvider>
      <SpaceHamLoader />
      <TopBar />
      <main>
        <Hero />
        <PortholeViewer />
        <Lore />
        <CircuitMap />
        <CharacterRoster />
        <Signature />
      </main>
      <Footer />
    </RadioProvider>
  );
}
