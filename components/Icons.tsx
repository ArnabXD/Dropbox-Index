import React, { ReactChild } from "react";

const Loader = () => (
  <div className="loadingScreen">
    <div className="lds-ellipsis">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  </div>
);

export const Loading = React.memo(Loader);

interface IconButtonI {
  children: ReactChild;
  onClick?: () => any;
}

export const IconButton = ({ children, onClick }: IconButtonI) => {
  return (
    <div className="hover:bg-slate-800 p-2 rounded-lg" onClick={onClick}>
      {children}
    </div>
  );
};
