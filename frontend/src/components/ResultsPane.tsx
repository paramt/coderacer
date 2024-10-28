import React from "react";

import { ResultMessage } from "../types";

interface ResultsPaneProps {
  name: string;
  results: ResultMessage | null;
}

export const ResultsPane: React.FC<ResultsPaneProps> = ({ name, results }) => {
  return (
    <div className="w-full">
      <h4 className="font-bold">{name}'s Results</h4>
      {results ? (
        results.results.map((result, index) => (
          <p key={index} className={`${result.includes("passed") ? "text-green-700" : "text-red-700"}`}>
            {result}
          </p>
        ))
      ) : (
        <p>No results yet.</p>
      )}
    </div>
  );
};
