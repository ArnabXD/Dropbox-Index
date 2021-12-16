import React from "react";
import Link from "next/link";
import { useDisclosure } from "@chakra-ui/hooks";
import { Search } from "./Icons";

export const Nav = () => {
  const title = process.env.NEXT_PUBLIC_TITLE ?? "D-Index";
  const { isOpen, onToggle } = useDisclosure();
  return (
    <nav className="px-6 py-3 border-b-2 border-cyan-500">
      <div className="flex flex-row justify-between items-center max-w-screen-md mx-auto">
        <Link href={"/"} passHref={true}>
          <a>
            <h3 className="text-2xl font-semibold hover:text-shadow">
              {title}
            </h3>
          </a>
        </Link>
        {/* MD+ */}
        <div className="hidden md:block">
          <div className="input-group max-w-sm flex flex-row items-center overflow-hidden rounded-full">
            <input
              type="search"
              className={"form-control h-10 p-2 w-full rounded-l-full"}
              placeholder="Search"
            />
            <Search className="bg-cyan-500 w-12 h-10 p-2"/>
          </div>
        </div>
        {/* SM */}
        <div className="input-group overflow-hidden rounded-full md:hidden">
          <Search className="bg-cyan-500 w-12 h-10 p-2" onClick={onToggle} />
        </div>
      </div>
      {isOpen && (
        <input
          type="search"
          className="form-control h-10 p-2 w-full block md:hidden rounded-full mt-3 text-slate-900 px-4"
          placeholder="Search"
        />
      )}
    </nav>
  );
};
