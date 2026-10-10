import React from "react";
import { useApp } from "../context/AppContext";

interface EFCPALogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export const EFCPALogo: React.FC<EFCPALogoProps> = ({
  className = "",
  size = "md",
}) => {
  const { shopLogoUrl } = useApp();
  const sizeMap = {
    sm: "h-8 w-auto",
    md: "h-11 sm:h-12 w-auto",
    lg: "h-14 sm:h-16 w-auto",
    xl: "h-20 sm:h-24 w-auto",
  };
  const imageSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src={shopLogoUrl || "/logo.png"}
        alt="EF CPA SHOP"
        className={`${imageSize} object-contain`}
      />
    </div>
  );
};
