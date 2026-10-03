'use client';

import React, { useState } from "react";

type PartsFilterBarProps = {
  onOpenChange?: (isOpen: boolean) => void;
};

export function PartsFilterBar({ onOpenChange }: PartsFilterBarProps) {
  const [open, setOpen] = useState(true);

  const toggleFilter = () => {
    const next = !open;
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur">
      <button
        type="button"
        onClick={toggleFilter}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-slate-700">Filter Parts</span>
        <span className="text-xs text-slate-500">{open ? "Hide" : "Show"}</span>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
        aria-hidden={!open}
        inert={open ? undefined : true}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`grid grid-cols-1 gap-3 border-t border-slate-100 p-4 transition-[opacity,transform] duration-300 md:grid-cols-3 lg:grid-cols-5 ${
              open
                ? "translate-y-0 opacity-100 delay-75"
                : "-translate-y-2 opacity-0"
            }`}
          >
        <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 outline-none focus:border-blue-500">
          <option>Part Category</option>
          <option>Engine</option>
          <option>Transmission</option>
          <option>Suspension</option>
          <option>Brakes</option>
        </select>

        <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 outline-none focus:border-blue-500">
          <option>Part Condition</option>
          <option>New</option>
          <option>Used</option>
          <option>Refurbished</option>
        </select>

        <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 outline-none focus:border-blue-500">
          <option>Any City</option>
          <option>Colombo</option>
          <option>Kandy</option>
          <option>Galle</option>
          <option>Jaffna</option>
        </select>

        <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 outline-none focus:border-blue-500">
          <option>Brand</option>
          <option>Toyota</option>
          <option>BMW</option>
          <option>Audi</option>
          <option>Tesla</option>
        </select>

        <select className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 outline-none focus:border-blue-500">
          <option>Fuel Type</option>
          <option>Petrol</option>
          <option>Diesel</option>
          <option>Hybrid</option>
          <option>Electric</option>
        </select>

        <input
          type="number"
          min={1900}
          max={2100}
          placeholder="Year Min"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 outline-none placeholder:text-slate-400 focus:border-blue-500"
        />

        <input
          type="number"
          min={1900}
          max={2100}
          placeholder="Year Max"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 outline-none placeholder:text-slate-400 focus:border-blue-500"
        />

        <input
          type="number"
          min={0}
          placeholder="Min Price"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 outline-none placeholder:text-slate-400 focus:border-blue-500"
        />

        <input
          type="number"
          min={0}
          placeholder="Max Price"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 outline-none placeholder:text-slate-400 focus:border-blue-500"
        />

        <button
          type="button"
          className="w-full rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          Search
        </button>
          </div>
        </div>
      </div>
    </div>
  );
}
