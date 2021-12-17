import { useEffect, useState } from "react";
import { HomeIcon } from "@heroicons/react/solid";
import Link from "next/link";
import { IconButton } from "./Icons";

export interface BCPaths {
  display: string;
  link?: string;
}

interface BCProps {
  path?: string;
}

export const Breadcrumb = (props: BCProps) => {
  const [path, setPath] = useState<BCPaths[]>([]);

  useEffect(() => {
    if (!props.path) {
      return setPath([]);
    }
    if (!props.path.includes("/")) {
      return setPath([{ display: props.path }]);
    }
    const paths = props.path.split("/").map<BCPaths>((value, index) => {
      return {
        display: value,
        link:
          index !== props.path!.split("/").length - 1
            ? "/" +
              props
                .path!.split("/")
                .slice(0, index + 1)
                .join("/")
            : undefined,
      };
    });
    setPath(paths);
  }, [props.path]);

  return (
    <div className="max-w-screen-md mx-auto p-2 flex flex-row items-center">
      <Link href={"/"} passHref={true}>
        <IconButton>
          <HomeIcon height={18} />
        </IconButton>
      </Link>
      {path.length ? (
        path.map((p) => (
          <span key={p.link + "-xyz"} className="flex flex-row items-center">
            {" / "}
            {p.link ? (
              <Link href={p.link} passHref>
                <p className="truncate font-semibold mx-1 hover:cursor-pointer">{p.display}</p>
              </Link>
            ) : (
              <p className="truncate mx-1">{p.display}</p>
            )}
          </span>
        ))
      ) : (
        <></>
      )}
    </div>
  );
};
