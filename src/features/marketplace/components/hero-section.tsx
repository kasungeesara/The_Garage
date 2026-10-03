'use client';

import React from "react";
import { PartsFilterBar } from "./parts-filter-bar";

export function HeroSection() {
  const [isFilterOpen, setIsFilterOpen] = React.useState(true);

  return (
    <>
      <section 
        className="relative flex items-center justify-center h-screen/2 px-6 py-25 overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: "url('/hero2.jpg')",
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-[#061B2D]/80"></div>
        <div className="absolute inset-0 bg-[#061B2D] mix-blend-screen"></div>
        
        {/* Content wrapper */}
        <div className="relative z-10 max-w-3xl text-center">
          <div className="mb-6 animate-fade-in">
            <span className="inline-block bg-yellow-400/90 text-blue-900 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              Trusted Auto Components
            </span>
          </div>
          
          <h2 className="text-4xl sm:text-3xl lg:text-5xl font-extrabold text-[#F36A20] mb-6 leading-tight drop-shadow-lg animate-fade-in-delay">
            Quality Parts at Affordable Prices
          </h2>
          
          <p className="text-base sm:text-lg text-gray-100 mb-8 leading-relaxed drop-shadow-md max-w-2xl mx-auto animate-fade-in-delay-2">
            Find genuine and replacement parts for all vehicle types. Fast, reliable, and budget-friendly.
          </p>
          
        </div>

        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/10 to-transparent"></div>

        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          :global(.animate-fade-in) {
            animation: fade-in 0.6s ease-out;
          }
          
          :global(.animate-fade-in-delay) {
            animation: fade-in 0.6s ease-out 0.1s both;
          }
          
          :global(.animate-fade-in-delay-2) {
            animation: fade-in 0.6s ease-out 0.2s both;
          }
          
          :global(.animate-fade-in-delay-3) {
            animation: fade-in 0.6s ease-out 0.3s both;
          }
        `}</style>
      </section>

      <div
        className={`relative z-20 mx-auto w-full px-6 pb-8 transition-[margin] duration-300 ${
          isFilterOpen ? "-mt-28" : "-mt-12"
        }`}
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, transparent 50%, #061B2D 50%, #061B2D 100%)",
        }}
      >
        <PartsFilterBar onOpenChange={setIsFilterOpen} />
      </div>
    </>
  );
}
