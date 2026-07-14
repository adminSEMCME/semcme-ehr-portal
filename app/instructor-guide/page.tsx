import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import WebsiteGuideContent from "@/components/WebsiteGuideContent";

export default function InstructorGuidePage() {
  return (
    <>
      <main className="min-h-screen pb-20 flex flex-col items-center font-sans">
        <AppHeader action="back" />

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-8 text-center leading-tight px-4">
          Instructor Guide
        </h1>

        <WebsiteGuideContent
          defaultExpanded
          collapsible={false}
          showFooterText={false}
        />
      </main>

      <Footer />
    </>
  );
}
