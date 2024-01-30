"use client";

import { useState } from "react";
import AddCounterForm from "./AddCounterForm";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";

const Header = () => {
  const [addFormIsActive, setAddFormIsActive] = useState<boolean>(false);

  const pathname = usePathname();

  return (
    <>
      <div className="px-4 py-2 border-b border-neutral-800 flex items-center justify-between text-sm uppercase tracking-[0.15em] h-12">
        {pathname == "/" ? (
          <>
            <h1>Counters</h1>
            {addFormIsActive ? (
              <button
                onClick={(e) => setAddFormIsActive(false)}
                className="bg-black rounded-md px-4 py-1.5 uppercase tracking-[0.15em] text-xs text-neutral-300"
              >
                Cancel &times;
              </button>
            ) : (
              <button
                onClick={(e) => setAddFormIsActive(true)}
                className="bg-neutral-900 rounded-md px-4 pr-2 py-1.5 uppercase tracking-[0.15em] text-xs text-neutral-300 flex items-center"
              >
                New counter <Plus height={14} />
              </button>
            )}
          </>
        ) : (
          <Link href="/" className="text-neutral-300 flex items-center">
            <ArrowLeft height={14} /> Back
          </Link>
        )}
      </div>
      {addFormIsActive && (
        <AddCounterForm setAddFormIsActive={setAddFormIsActive} />
      )}
    </>
  );
};

export default Header;
