"use client";

import React, { useRef } from "react";
import { useOutsideClick } from "~~/hooks/helper";

/**
 * Site header
 */
export const Header = () => {
  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <div className="">
      <div className="">{/*<RainbowKitCustomConnectButton />*/}</div>
    </div>
  );
};
