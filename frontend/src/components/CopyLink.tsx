import React, { useState } from "react";

interface LinkCopyProps {
  url: string;
}

export const CopyLink: React.FC<LinkCopyProps> = ({ url }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text: ", error);
    }
  };

  return (
    <div className="flex items-center">
      <p className="bg-slate-300 rounded-l-md p-2 ">{url}</p>
      <button className="bg-blue-950 rounded-r-md text-white h-full p-2 hover:bg-blue-900" onClick={handleCopy}>
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
};
